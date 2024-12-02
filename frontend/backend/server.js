const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");
const { convertToPdf } = require("docx-pdf"); // Install docx-pdf for conversion

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://2004vimal:zaq1%40wsx@cluster0.kfsrfxi.mongodb.net/SiddhaShivalayas",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
const stockRoutes = require("./routes/stock");
const patientRoutes = require("./routes/patient");

app.use("/stocks", stockRoutes);
app.use("/patients", patientRoutes);

app.get("/", (req, res) => {
  res.json("Hello World");
});

const content = fs.readFileSync(
  path.resolve(__dirname, "./bill_template.docx"),
  "binary"
);
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);

app.post("/generate-bill", (req, res) => {
  const {
    id,
    name,
    phone,
    address,
    treatmentOrMedicine,
    date,
    items,
    discount,
  } = req.body;

  // Ensure 'items' array is not empty
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send("Error: No items provided for the bill.");
  }

  // Load the template file
  const templatePath = path.join(__dirname, "bill_template.docx");
  let template;
  try {
    template = fs.readFileSync(templatePath, "binary");
  } catch (err) {
    console.error("Error loading template file:", err);
    return res.status(500).send("Error loading template file: " + err.message);
  }

  const zip = new PizZip(template);
  let doc;
  try {
    doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  } catch (err) {
    console.error("Error initializing docxtemplater:", err);
    return res.status(500).send("Error initializing template: " + err.message);
  }

  // Calculate item totals, GST for each item, and update items array
  const itemTotals = items.map((item) => {
    const itemPrice = parseFloat(item.price);
    const itemQuantity = parseFloat(item.quantity);
    const gstRate = parseFloat(item.GST) / 100; // Convert GST percentage to decimal (e.g., 18% -> 0.18)

    // Calculate the base total price (without GST)
    const baseTotal = itemPrice * itemQuantity;

    // Calculate GST for the item
    const gstAmount = baseTotal * gstRate;

    // Final price including GST
    const finalAmount = baseTotal + gstAmount;

    return {
      ...item,
      baseTotal: baseTotal.toFixed(2), // Item price before GST
      gstAmount: gstAmount.toFixed(2), // GST amount for the item
      finalAmount: finalAmount.toFixed(2), // Final price including GST
    };
  });

  // Calculate subtotal, total GST, and final total with discount
  const subtotal = itemTotals.reduce(
    (sum, item) => sum + parseFloat(item.baseTotal),
    0
  );

  const totalGST = itemTotals.reduce(
    (sum, item) => sum + parseFloat(item.gstAmount),
    0
  );

  const finalTotal = (
    subtotal +
    totalGST -
    (parseFloat(discount) || 0)
  ).toFixed(2);

  // Replace placeholders with form data
  doc.setData({
    id,
    name,
    phone,
    address,
    treatmentOrMedicine,
    date,
    items: itemTotals, // Pass items array with calculated values to the document template
    subtotal: subtotal.toFixed(2),
    totalGST: totalGST.toFixed(2), // Add the total GST to the document
    discount: discount.toFixed(2),
    total: finalTotal,
  });

  try {
    doc.render(); // Render the document with replaced placeholders
  } catch (err) {
    console.error("Error rendering document:", err);
    return res.status(500).send("Error generating bill: " + err.message);
  }

  const buf = doc.getZip().generate({ type: "nodebuffer" });

  // Send the file as a downloadable response without saving it
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=generated-bill-${id}.docx`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.send(buf);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

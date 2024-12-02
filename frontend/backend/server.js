const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");

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

// Cache the template content to avoid reading it multiple times
const templatePath = path.resolve(__dirname, "bill_template.docx");
let content;
try {
  content = fs.readFileSync(templatePath, "binary");
} catch (err) {
  console.error("Error loading template file:", err);
  process.exit(1); // Exit the process if template loading fails
}

const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

// Optimized Bill Generation Endpoint
app.post("/generate-bill", (req, res) => {
  const {
    id,
    name,
    phone,
    address,
    treatmentOrMedicine,
    date,
    items,
    discount, // discount might not be a number, ensure it is a valid number
  } = req.body;

  // Ensure 'items' array is not empty
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send("Error: No items provided for the bill.");
  }

  // Ensure discount is a valid number (if undefined, default to 0)
  const discountValue = isNaN(discount) ? 0 : parseFloat(discount);

  // Log to check if discount is valid
  console.log("Discount value: ", discountValue);

  try {
    // Proceed with the bill generation (same as before)

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

    const finalTotal = (subtotal + totalGST - discountValue) // Use the validated discountValue here
      .toFixed(2);

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
      discount: discountValue.toFixed(2), // Ensure discount is formatted correctly
      total: finalTotal,
    });

    try {
      doc.render(); // Render the document with replaced placeholders
    } catch (err) {
      console.error("Error rendering document:", err);
      return res.status(500).send("Error generating bill: " + err.message);
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // Send the generated document as a downloadable response
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=generated-bill-${id}.docx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buf);
  } catch (err) {
    console.error("Error during bill generation:", err);
    return res.status(500).send("Internal server error during bill generation");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

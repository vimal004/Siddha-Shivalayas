const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();

// Middleware
app.use(cors());  // Enable CORS (Cross-Origin Resource Sharing)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
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

// Bill Schema (Model for storing bills)
const BillSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  treatmentOrMedicine: { type: String, required: true },
  date: { type: Date, required: true },
  items: [
    {
      description: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      GST: { type: Number, required: true },
      baseTotal: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
      finalAmount: { type: Number, required: true },
    },
  ],
  discount: { type: Number, default: 0 },
});

const Bill = mongoose.model("Bill", BillSchema);

// Optimized Bill Generation Endpoint
app.post("/generate-bill", async (req, res) => {
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

  // Validation: Ensure all required fields are provided
  if (
    !id &&
    !name &&
    !phone &&
    !address &&
    !date &&
    !Array.isArray(items) &&
    items.length === 0
  ) {
    return res.status(400).send("Error: Missing required fields.");
  }

  // Validate items structure
  for (let item of items) {
    if (!item.description || !item.price || !item.quantity || !item.GST) {
      return res
        .status(400)
        .send(
          "Error: Each item must have description, price, quantity, and GST."
        );
    }
    if (isNaN(item.price) || isNaN(item.quantity) || isNaN(item.GST)) {
      return res
        .status(400)
        .send("Error: Price, quantity, and GST must be valid numbers.");
    }
  }

  // Ensure discount is a valid number (if undefined, default to 0)
  const discountValue = isNaN(discount) ? 0 : parseFloat(discount);

  // Process items and calculate totals
  const itemTotals = items.map((item) => {
    const itemPrice = parseFloat(item.price);
    const itemQuantity = parseFloat(item.quantity);
    const gstRate = parseFloat(item.GST) / 100;

    const baseTotal = itemPrice * itemQuantity;
    const gstAmount = baseTotal * gstRate;
    const finalAmount = baseTotal + gstAmount;

    return {
      ...item,
      baseTotal: baseTotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
    };
  });

  // Calculate subtotal, total GST, and final total
  const subtotal = itemTotals.reduce(
    (sum, item) => sum + parseFloat(item.baseTotal),
    0
  );
  const totalGST = itemTotals.reduce(
    (sum, item) => sum + parseFloat(item.gstAmount),
    0
  );
  const finalTotal = (subtotal + totalGST - discountValue).toFixed(2);

  // Save the bill to the database
  const newBill = new Bill({
    id,
    name,
    phone,
    address,
    treatmentOrMedicine,
    date,
    items: itemTotals, // Pass items array with calculated values to the database
    subtotal: subtotal.toFixed(2),
    totalGST: totalGST.toFixed(2),
    discount: discountValue.toFixed(2),
    total: finalTotal,
  });

  try {
    // Save the new bill to MongoDB
    await newBill.save();

    // Create a new Docxtemplater instance for each request
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Set data for Docxtemplater
    doc.setData({
      id,
      name,
      phone,
      address,
      treatmentOrMedicine,
      date,
      items: itemTotals, // Pass items array with calculated values to the document template
      subtotal: subtotal.toFixed(2),
      totalGST: totalGST.toFixed(2),
      discount: discountValue.toFixed(2),
      total: (subtotal + totalGST - discountValue).toFixed(2),
    });

    // Render the document only once after setting all data
    doc.render();

    // Generate the document buffer
    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // Send the generated document as a downloadable response
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=generated-bill-${id}.pdf`
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

// New API: Fetch all bill history
app.get("/bills-history", async (req, res) => {
  try {
    const bills = await Bill.find(); // Fetch all bills from MongoDB
    res.json(bills); // Send all bills as a response
  } catch (error) {
    console.error("Error fetching bill history:", error);
    res.status(500).json({ error: "Error fetching bill history." });
  }
});

// New API: Fetch a specific bill by ID
app.get("/bills/:billId", async (req, res) => {
  const { billId } = req.params;
  const { fileFormat } = req.query; // query parameter for file format (docx or pdf)

  try {
    const bill = await Bill.findOne({ id: billId });
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    // Load the template file for DOCX
    const templatePath = path.resolve(__dirname, "bill_template.docx");
    let content;
    try {
      content = fs.readFileSync(templatePath, "binary");
    } catch (err) {
      return res.status(500).send("Template file not found.");
    }

    if (fileFormat === "pdf") {
      // Generate PDF file
      const doc = new PDFDocument();
      res.setHeader("Content-Disposition", `attachment; filename=generated-bill-${billId}.pdf`);
      res.setHeader("Content-Type", "application/pdf");
      
      // Add content to PDF
      doc.fontSize(12).text(`Bill ID: ${bill.id}`);
      doc.text(`Patient Name: ${bill.name}`);
      doc.text(`Phone: ${bill.phone}`);
      doc.text(`Address: ${bill.address}`);
      doc.text(`Treatment/Medicine: ${bill.treatmentOrMedicine}`);
      doc.text(`Date: ${bill.date}`);
      // Add more bill details here...

      doc.pipe(res);
      doc.end();
    } else {
      // Default to DOCX generation
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // Set data for DOCX template
      doc.setData({
        id: bill.id,
        name: bill.name,
        phone: bill.phone,
        address: bill.address,
        treatmentOrMedicine: bill.treatmentOrMedicine,
        date: bill.date,
        items: bill.items,
        subtotal: bill.items.reduce((sum, item) => sum + item.baseTotal, 0).toFixed(2),
        totalGST: bill.items.reduce((sum, item) => sum + item.gstAmount, 0).toFixed(2),
        discount: bill.discount.toFixed(2),
        total: (bill.items.reduce((sum, item) => sum + item.baseTotal, 0) - bill.discount).toFixed(2),
      });

      // Render the document
      doc.render();

      // Generate the document buffer
      const buf = doc.getZip().generate({ type: "nodebuffer" });

      // Send the DOCX file
      res.setHeader("Content-Disposition", `attachment; filename=generated-bill-${billId}.docx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.send(buf);
    }
  } catch (err) {
    console.error("Error during bill generation:", err);
    res.status(500).send("Internal server error during bill generation");
  }
});

// New API: Delete a specific bill by ID
app.delete("/bills/:billId", async (req, res) => {
  const { billId } = req.params;

  try {
    const bill = await Bill.findByIdAndDelete(billId);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json({ message: "Bill deleted successfully." });
  } catch (error) {
    console.error("Error deleting the bill:", error);
    res.status(500).json({ error: "Error deleting the bill." });
  }
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

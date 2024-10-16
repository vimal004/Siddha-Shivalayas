const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");

// Create Stock
router.post("/", async (req, res) => {
  try {
    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read All Stocks
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read Single Stock by ID
router.get("/:id", async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Stock
router.put("/:id", async (req, res) => {
  try {
    const stock = await Stock.findOneAndUpdate(
      { stockId: req.params.id },
      req.body,
      {
        new: true,
      }
    );
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete Stock
router.delete("/:id", async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ stockId: req.params.id });
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json({ message: "Stock deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Snackbar,
  CircularProgress,
  Grid,
  Typography,
  Container,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

const StockForm = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    stockId: "",
    productName: "",
    quantity: "",
    price: "",
    hsnCode: "",
    discount: "",
    gst: "",
  });

  const resetForm = () => {
    setFormData({
      stockId: "",
      productName: "",
      quantity: "",
      price: "",
      hsnCode: "",
      discount: "",
      gst: "",
    });
  };

  const [created, setCreated] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = () => {
    setLoadingDelete(true); // Start loading state
    axios
      .delete(
        `https://siddha-shivalayas-backend.vercel.app/stocks/${formData.stockId}`
      )
      .then(() => {
        setDeleted(true); // Mark as deleted
        resetForm(); // Clear form data
        setTimeout(() => {
          setDeleted(false); // Reset after 3 seconds
        }, 3000);
      })
      .catch((err) => {
        console.error("Error deleting stock:", err); // Log the error for debugging
        setErrorMessage("Stock deletion failed"); // Show error message
        setSuccess(false); // Reset success flag
      })
      .finally(() => setLoadingDelete(false)); // Always stop loading state
  };

  const handleUpdate = () => {
    setLoadingUpdate(true);
    axios
      .put(
        `https://siddha-shivalayas-backend.vercel.app/stocks/${formData.stockId}`,
        formData
      )
      .then(() => {
        setUpdated(true);
        resetForm();
        setTimeout(() => {
          setUpdated(false);
        }, 3000);
      })
      .catch((err) => {
        console.error("Error updating stock:", err);
        setErrorMessage("Stock update failed");
        setSuccess(false);
      })
      .finally(() => setLoadingUpdate(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    axios
      .post("https://siddha-shivalayas-backend.vercel.app/stocks", formData)
      .then(() => {
        setSuccess(true);
        setCreated(true);
        resetForm();
        setTimeout(() => {
          setCreated(false);
          setSuccess(null);
          setErrorMessage("");
        }, 3000);
      })
      .catch((err) => {
        console.error("Error creating stock:", err);
        setSuccess(false);
        setErrorMessage("Stock creation failed");
      })
      .finally(() => setLoadingCreate(false));
  };

  const isIdEntered = formData.stockId.trim() !== "";

  return (
    <Container maxWidth="md" style={{ marginTop: "50px" }}>
      <div
        style={{
          background: "#ffffff",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)",
          padding: "24px",
          borderRadius: "8px",
          width: "100%",
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          <strong>Stock Form</strong>
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Stock ID"
                name="stockId"
                value={formData.stockId}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                required
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="HSN Code"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Discount"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="GST"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                InputProps={{
                  style: { borderRadius: "8px" },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disableElevation
                  disabled={!isIdEntered || loadingCreate}
                  style={{
                    borderRadius: "8px",
                    textTransform: "none",
                    margin: "8px",
                  }}
                >
                  {loadingCreate ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  disableElevation
                  disabled={!isIdEntered || loadingUpdate}
                  onClick={handleUpdate}
                  style={{
                    borderRadius: "8px",
                    textTransform: "none",
                    margin: "8px",
                  }}
                >
                  {loadingUpdate ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Update"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disableElevation
                  disabled={!isIdEntered || loadingDelete}
                  onClick={handleDelete}
                  style={{
                    borderRadius: "8px",
                    textTransform: "none",
                    margin: "8px",
                  }}
                >
                  {loadingDelete ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </Grid>
          </Grid>
          <Snackbar
            open={created || deleted || updated}
            autoHideDuration={3000}
            onClose={() => {
              setCreated(false);
              setDeleted(false);
              setUpdated(false);
            }}
          >
            <MuiAlert
              elevation={6}
              variant="filled"
              severity="success"
              onClose={() => {
                setCreated(false);
                setDeleted(false);
                setUpdated(false);
              }}
            >
              {created && "Stock Created"}
              {deleted && "Stock Deleted"}
              {updated && "Stock Updated"}
            </MuiAlert>
          </Snackbar>
          {success === false && (
            <Snackbar open={true} autoHideDuration={3000}>
              <MuiAlert elevation={6} variant="filled" severity="error">
                {errorMessage}
              </MuiAlert>
            </Snackbar>
          )}
        </form>
      </div>
    </Container>
  );
};

export default StockForm;

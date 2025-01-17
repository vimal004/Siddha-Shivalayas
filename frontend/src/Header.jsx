import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Person as PersonIcon,
  PeopleAlt as PeopleAltIcon,
  Inventory2 as InventoryIcon,
  ReceiptLong as ReceiptIcon,
  History as HistoryIcon,
  LogoutOutlined as LogoutIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import logo from "./img/Logo.svg";
import { styled } from "@mui/system";

const Header = () => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const navigationLinks = [
    { to: "/allpatients", icon: <PeopleAltIcon />, label: "View Patients" },
    { to: "/managepatients", icon: <PersonIcon />, label: "Manage Patients" },
    { to: "/managestocks", icon: <InventoryIcon />, label: "Manage Stocks" },
    { to: "/viewstocks", icon: <InventoryIcon />, label: "View Stocks" },
    { to: "/billhistory", icon: <HistoryIcon />, label: "Bill History" },
  ];

  return (
    <StyledAppBar position="static" elevation={0}>
      <Toolbar sx={{ minHeight: { xs: 80, sm: 80 } }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={isHome ? "center" : "space-between"}
          width="100%"
          flexDirection={isSm ? "row" : "column"}
          gap={2}
          marginTop={1}
          marginBottom={1}
        >
          <HeaderLogoAndTitle isSm={isSm} isHome={isHome}>
            <Link
              to="/home"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Logo src={logo} alt="Logo" />
              <Typography
                variant="h5"
                sx={{
                  ml: 2,
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  background: "linear-gradient(45deg, #1976d2, #2196f3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Customer Database Management
              </Typography>
            </Link>
          </HeaderLogoAndTitle>

          {location.pathname === "/home" && (
            <LogoutButton
              onClick={handleLogout}
              variant="contained"
              startIcon={<LogoutIcon />}
            >
              Logout
            </LogoutButton>
          )}

          {!isHome && (
            <Box>
              {isSm ? (
                <Navigation isSm={isSm}>
                  {navigationLinks.map((link, index) => (
                    <NavButton
                      key={index}
                      component={Link}
                      to={link.to}
                      startIcon={link.icon}
                    >
                      {link.label}
                    </NavButton>
                  ))}
                </Navigation>
              ) : (
                <IconButton
                  size="large"
                  aria-label="menu"
                  onClick={handleMenuClick}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  style: {
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                {navigationLinks.map((link, index) => (
                  <MenuItem
                    key={index}
                    component={Link}
                    to={link.to}
                    onClick={handleMenuClose}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 500,
                      color: "#2c3e50",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                      },
                    }}
                  >
                    {link.icon}
                    {link.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  padding: "4px 0",
}));

const HeaderLogoAndTitle = styled(Box)(({ isSm, isHome }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: isHome ? "center" : isSm ? "flex-start" : "center",
  transition: "all 0.3s ease",
}));

const Logo = styled("img")({
  height: "48px",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
});
const Navigation = styled("nav")(({ isSm }) => ({
  display: isSm ? "flex" : "none",
  alignItems: "center",
  textAlign: isSm ? "initial" : "center",
  gap: "8px",
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: "#2c3e50",
  fontWeight: 500,
  padding: "10px 20px",
  borderRadius: "12px",
  textTransform: "none",
  fontSize: "0.95rem",
  fontFamily: '"Poppins", sans-serif',
  transition: "all 0.2s ease",
  backgroundColor: "transparent",
  border: "1px solid transparent",
  "&:hover": {
    backgroundColor: "rgba(25, 118, 210, 0.08)",
    transform: "translateY(-2px)",
    border: "1px solid rgba(25, 118, 210, 0.1)",
  },
  "& .MuiButton-startIcon": {
    color: "#1976d2",
  },
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #1976d2, #2196f3)",
  color: "white",
  padding: "10px 24px",
  borderRadius: "6px",
  textTransform: "none",
  fontSize: "0.95rem",
  fontWeight: 600,
  fontFamily: '"Poppins", sans-serif',
  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
  transition: "all 0.2s ease",
  border: "none",
  //marginBottom: "10px",  
  "&:hover": {
    background: "linear-gradient(45deg, #1565c0, #1976d2)",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(25, 118, 210, 0.2)",
  },
}));

export default Header;

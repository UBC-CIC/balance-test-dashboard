import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import { Link, useNavigate, redirect } from "react-router-dom";
import { Auth, Hub } from 'aws-amplify';

const pages = ["Patients"];
const settings = ["Log Out"];

function ResponsiveAppBar({ loginState, setLoginState }) {
  // const { user } = Auth.currentAuthenticatedUser();

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  
  // const [loginState, setLoginState] = React.useState(false);

  let navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    navigate("patientTable");
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleUserMenuItemClick = (setting) => {
    setAnchorElUser(null);

    if (setting === "Log Out") {
      Auth.signOut();
      // navigate("/");
    }
  };

  async function setAuthListener() {
    Hub.listen('auth', (listenerData) => {
      switch (listenerData.payload.event) {
        case "signOut":
          navigate("/")
          break;
        case "signIn":
          break;
        default:
          break;
      }
      
    });
  }

  React.useEffect(() => {
    setAuthListener();

    // if (loginState == false) {
    //   navigate("/");
    // }
  }, [])

  return (
    <AppBar position="static">
      {loginState === true ? (
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              align='center'
              variant="h6"
              href="/"
              noWrap
              component="a"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 500,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Balance Test
            </Typography>
            
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page} onClick={handleCloseNavMenu}>
                    <Typography textAlign="center">
                      {<Link to="/">{page}</Link>}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Typography
              variant="h6"
              href="/"
              noWrap
              component="a"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 500,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Balance Test
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  {page}
                </Button>
              ))}
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={() => {handleUserMenuItemClick(setting)}}>
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>

      ) : (
        <Toolbar>
          <Typography
            align='center'
            variant="h6"
            href="/"
            noWrap
            component="a"
            sx={{
              my: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 500,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Balance Test
          </Typography>
          
          <Typography
            variant="h6"
            href="/"
            noWrap
            component="a"
            sx={{
              my: 2,
              display: { xs: "flex", md: "none" },
              fontWeight: 500,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Balance Test
          </Typography>
        </Toolbar>
      )}
    </AppBar>
  );
}
export default ResponsiveAppBar;

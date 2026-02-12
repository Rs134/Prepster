import { Link, useNavigate } from "react-router-dom";

function Header({ user, onSignOut }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onSignOut) onSignOut();
    navigate('/signin');
  };

  return (
    <header>
      <div className="header-group">
        <div className="header-logo">
          <button className="logo-btn" onClick={() => navigate('/')}> Prepster</button>
        </div>
        <div className="header-btns">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <Link to="/profile">
                <button className="btn">Profile</button>
              </Link>
              <button className="btn" onClick={handleSignOut}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/signin">
              <button className="acct-btn btn">Login</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import './style.css';
import { useAuth } from '../../contexts/AuthContext';
import './style.css';

const Login = () => {


    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user]);


    const handleSubmit = async evt => {
        evt.preventDefault();

        if (!email || !password) {
            setError("Please enter  both email and password");
            return;
        }

        try {
            setError('');
            setLoading(true);

            const result = await login(email, password);

            if (result.success) {
                 navigate('/', { replace: true });
            } else {
                setError(result.message || "Failed to log in. Please check your credentails.");
            }

        } catch (err) {
            console.log("Login error:", err);
            setError("An unexpected error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <Card className="login-card">
                    <Card.Body className="p-4">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold mb-1">Welcome Back</h2>
                            <p className="text-muted">Sign in to your HRMS account</p>
                        </div>

                        {error && (
                            <Alert
                                variant="danger"
                                className="d-flex align-items-center"
                                onClose={() => setError('')}
                                dismissible
                            >
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                <div>{error}</div>
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit} className="mt-3">
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-person"></i>
                                    </span>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <div className="d-flex justify-content-between">
                                    <Form.Label>Password</Form.Label>
                                    {/* <Link to="/forgot-password" className="small">
                                        Forgot password?
                                    </Link> */}
                                </div>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-lock"></i>
                                    </span>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-2 mb-3"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>

                            <div className="divider my-4">
                                <span className="px-2 bg-white text-muted">OR</span>
                            </div>

                            {/* <div className="text-center mt-3">
                                <p className="mb-0">
                                    Don't have an account?{' '}
                                    <Link to="/signup" className="text-primary fw-medium">
                                        Sign up
                                    </Link>
                                </p>
                            </div> */}
                        </Form>
                    </Card.Body>
                </Card>

                <div className="text-center mt-4">
                    <p className="text-muted small">
                        © {new Date().getFullYear()} Raynx Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}


export default Login;
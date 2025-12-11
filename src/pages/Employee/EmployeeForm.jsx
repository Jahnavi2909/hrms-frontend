import { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Container } from "react-bootstrap";
import './style.css';

const EmployeeForm = ({ editingEmployee, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        departmentName: "",
        designation: "",
        joiningDate: "",
        dateOfBirth: "",
        salary: "",
        employeeId: "",
        password: "",
    });

    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (editingEmployee) {
            setFormData({
                firstName: editingEmployee.firstName || "",
                lastName: editingEmployee.lastName || "",
                email: editingEmployee.email || "",
                phone: editingEmployee.phone || "",
                departmentName: editingEmployee.departmentName || "",
                designation: editingEmployee.designation || "",
                employeeId: editingEmployee.employeeId || "",
                salary: editingEmployee.salary || "",
                joiningDate: editingEmployee.joiningDate ? editingEmployee.joiningDate.split("T")[0] : "",
                dateOfBirth: editingEmployee.dateOfBirth ? editingEmployee.dateOfBirth.split("T")[0] : "",
                password: "", 
            });
        }
    }, [editingEmployee]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        try {
            await onSubmit(formData);
            setMessage(editingEmployee ? "Employee updated successfully!" : "Employee added successfully!");
        } catch (err) {
            setError(err.message || "Failed to save employee.");
        }
    };

    return (
        <Container className="d-flex justify-content-center">
            <Card style={{ maxWidth: '1500px', width: '100%' }} className="employee-form-card mb-4">
                <Card.Header>{editingEmployee ? "Edit Employee" : "Add Employee"}</Card.Header>
                <Card.Body>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control name="departmentName" value={formData.departmentName} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Designation</Form.Label>
                                <Form.Control name="designation" value={formData.designation} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Joining Date</Form.Label>
                                <Form.Control type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Employee Id</Form.Label>
                                <Form.Control type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Date of birth</Form.Label>
                                <Form.Control type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Salary</Form.Label>
                                <Form.Control type="number" name="salary" value={formData.salary} onChange={handleChange} />
                            </div>

                            <div className="col-md-6 mb-2">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" name="password" value={formData.password || ""} onChange={handleChange} required />
                            </div>
                            
                            <div className="col-md-6 mb-2">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" name="password" value={formData.password || ""} onChange={handleChange} required />
                            </div>

                        </div>
                        <div className="d-flex">
                            <Button type="submit" variant="primary" className="me-2">
                                {editingEmployee ? "Update" : "Add"} Employee
                            </Button>
                            {editingEmployee && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EmployeeForm;

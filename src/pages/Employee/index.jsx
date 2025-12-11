import { useState, useEffect } from "react";
import { Button, Card, Container, Table, Form, Collapse } from "react-bootstrap";
import { FaEdit, FaTrash, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { employeeApi } from "../../services/api";
import EmployeeForm from "./EmployeeForm"; // import form component
import "./style.css";

const Employee = () => {
    const { user } = useAuth();
    const isAdminOrHr = ['ROLE_ADMIN', 'ROLE_HR', "ROLE_MANAGER"].includes(user?.role);

    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [openForm, setOpenForm] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await employeeApi.getAllEmployee();
            if (response.data?.data) setEmployees(response.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setOpenForm(true);
    };

    const handleCancel = () => {
        setEditingEmployee(null);
        setOpenForm(false);
    };

    const handleSubmit = async (data) => {
        if (editingEmployee) {
            await employeeApi.update(editingEmployee.id, data);
        } else {
            await employeeApi.create(data);
        }
        fetchEmployees();
        handleCancel();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        await employeeApi.delete(id);
        setEmployees(employees.filter(e => e.id !== id));
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Employee Management</h2>
                {isAdminOrHr && (
                    <Button variant="primary" onClick={() => setOpenForm(!openForm)}>
                        <FaUserPlus className="me-2" />
                        {openForm ? "Close Form" : "Add Employee"}
                    </Button>
                )}
            </div>

            <Collapse in={openForm}>
                <div>
                    <EmployeeForm
                        editingEmployee={editingEmployee}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />
                </div>
            </Collapse>

            <Card>
                <Card.Body>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div style={{ width: '300px' }}>
                            <Form.Control
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <Table hover className="align-middle">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Position</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Join Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length ? (
                                    filteredEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>{emp.firstName} {emp.lastName} <br /><small className="text-muted">{emp.email}</small></td>
                                            <td>{emp.designation}</td>
                                            <td>{emp.departmentName}</td>
                                            <td>{emp.status || "ACTIVE"}</td>
                                            <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div className="d-flex">
                                                    <Button variant="link" size="sm" className="text-primary p-0 me-2"
                                                        onClick={() => handleEdit(emp)}
                                                        disabled={!isAdminOrHr}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button variant="link" size="sm" className="text-danger p-0"
                                                        onClick={() => handleDelete(emp.id)}
                                                        disabled={!isAdminOrHr}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">No employees found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Employee;

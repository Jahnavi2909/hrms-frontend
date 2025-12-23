import { useState, useEffect } from "react";
import { Button, Card, Container, Table, Form, Collapse } from "react-bootstrap";
import { FaEdit, FaTrash, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL, employeeApi } from "../../services/api";
import EmployeeForm from "./EmployeeForm"; // import form component
import "./style.css";
import { useNavigate, useParams } from "react-router-dom";

const Employee = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const isAdminOrHr = ['ROLE_ADMIN', 'ROLE_HR', "ROLE_MANAGER"].includes(user?.role);

    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmployees();
    }, [id]);

    const fetchEmployees = async () => {
        try {
            let response;

            if (id) {
                response = await employeeApi.getEmployeeByDepartment(id);
            } else {
                response = await employeeApi.getAllEmployee();
            }
            if (response.data?.data) {
                setEmployees(response.data.data);
            }
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

                    <div className="table-responsive desktop-table">
                        <Table hover className="align-middle table">
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
                                        <tr key={emp.id}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => navigate(`/employees/${emp.id}`)}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <img
                                                        src={
                                                            emp.avatar
                                                                ? `${API_BASE_URL}${emp.avatar}`
                                                                : "/profile.jpg"
                                                        }
                                                        alt="Avatar"
                                                        style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginRight: "10px" }}
                                                    />

                                                    <div className="employee-text">
                                                        <div className="name">
                                                            {emp.firstName} {emp.lastName}
                                                        </div>
                                                        <small className="email">{emp.email}</small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{emp.designation}</td>
                                            <td>{emp.departmentName}</td>
                                            <td>{emp.status || "ACTIVE"}</td>
                                            <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <div className="d-flex">
                                                    <Button variant="link" size="sm" className="text-primary p-0 me-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(emp);
                                                        }}
                                                        disabled={!isAdminOrHr}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button variant="link" size="sm" className="text-danger p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(emp.id)
                                                        }
                                                        }
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

                    {/* MOBILE CARD VIEW */}
                    <div className="mobile-list d-md-none">
                        {filteredEmployees.length ? (
                            filteredEmployees.map(emp => (
                                <div className="mobile-card" key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)}>

                                    <div className="field">
                                        <img src={emp.avatarUrl || "/profile.jpg"} alt="Avatar" className="avatar mb-2" />
                                        <div className="label">Employee</div>
                                        <div className="value">{emp.firstName} {emp.lastName}</div>
                                        <div className="value text-muted" style={{ fontSize: "12px" }}>{emp.email}</div>
                                    </div>

                                    <div className="field">
                                        <div className="label">Position</div>
                                        <div className="value">{emp.designation}</div>
                                    </div>

                                    <div className="field">
                                        <div className="label">Department</div>
                                        <div className="value">{emp.departmentName}</div>
                                    </div>

                                    <div className="field">
                                        <div className="label">Status</div>
                                        <div className="value">{emp.status || "ACTIVE"}</div>
                                    </div>

                                    <div className="field">
                                        <div className="label">Join Date</div>
                                        <div className="value">
                                            {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A"}
                                        </div>
                                    </div>

                                    {/* ACTION BUTTONS */}
                                    <div className="actions">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-primary p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(emp)
                                            }
                                            }
                                        >
                                            <FaEdit />
                                        </Button>

                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(emp.id)
                                            }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <p className="text-center py-3">No employees found.</p>
                        )}
                    </div>



                </Card.Body>
            </Card>
        </Container>
    );
};

export default Employee;

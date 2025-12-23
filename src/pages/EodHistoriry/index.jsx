import { useEffect, useState } from "react";
import { Card, Badge } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { eodApi } from "../../services/api";
import EmployeeProfileInfo from "../../contexts/layout/EmployeeProfileInfo";

/* ---------- Helpers ---------- */

const statusVariant = (status) => {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    default:
      return "primary";
  }
};

/* ---------- Main Component ---------- */

const EODHistory = ({ employeeId }) => {
  const { id } = useParams();
  const empCode = id || employeeId;

  const [eods, setEODs] = useState([]);
  const [error, setError] = useState("");

  /* ---- Fetch EOD History ---- */
  useEffect(() => {
    const fetchEODs = async () => {
      try {
        const res = await eodApi.getByEmployee(empCode);
        setEODs(res.data?.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load EOD history");
      }
    };

    if (empCode) fetchEODs();
  }, [empCode]);

  return (
    <div>
      {error && <p className="text-danger">{error}</p>}

      <EmployeeProfileInfo empId={empCode} />

      <Card className="mt-3">
        <Card.Header>EOD History</Card.Header>
        <Card.Body>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="table-responsive d-none d-md-block">
            {eods.length ? (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Work Summary</th>
                    <th>Blockers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eods.map((eod) => (
                    <tr key={eod.id}>
                      <td>{eod.date}</td>
                      <td>{eod.workSummary}</td>
                      <td>{eod.blockers || "--"}</td>
                      <td>
                        <Badge bg={statusVariant(eod.status)}>
                          {eod.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No EOD records found</p>
            )}
          </div>

          {/* ================= MOBILE CARDS ================= */}
          <div className="d-block d-md-none">
            {eods.length === 0 && (
              <p className="text-center text-muted">No EOD records found</p>
            )}

            {eods.map((eod) => (
              <Card key={eod.id} className="mb-3 shadow-sm">
                <Card.Body>

                  <div className="mb-2">
                    <strong>Date:</strong> {eod.date}
                  </div>

                  <div className="mb-2">
                    <strong>Work Summary:</strong>
                    <div>{eod.workSummary}</div>
                  </div>

                  <div className="mb-2">
                    <strong>Blockers:</strong>{" "}
                    {eod.blockers || "--"}
                  </div>

                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    <Badge bg={statusVariant(eod.status)}>
                      {eod.status}
                    </Badge>
                  </div>

                </Card.Body>
              </Card>
            ))}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default EODHistory;

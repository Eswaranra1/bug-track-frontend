import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import API from "../services/api";
import AppLayout from "../components/AppLayout";

const COLUMNS = [
  { id: "open", title: "Open" },
  { id: "triaged", title: "Triaged" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "testing", title: "Testing" },
  { id: "resolved", title: "Resolved" },
  { id: "closed", title: "Closed" },
];

const PRIORITY_COLOR = { high: "#ef4444", medium: "#eab308", low: "#22c55e", critical: "#dc2626" };
const STATUS_COLOR = { open: "#818cf8", triaged: "#a78bfa", "in-progress": "#eab308", "in-review": "#f59e0b", testing: "#06b6d4", resolved: "#22c55e", closed: "#64748b" };

function KanbanCard({ bug, isDragging, updatingId, onOpenDetails, justDragged }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: bug._id });
  const priority = bug.priority || "medium";
  const status = bug.status || "open";
  const handleClick = () => {
    if (justDragged.current) return;
    onOpenDetails(bug._id);
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="kanban-card"
      style={{
        opacity: isDragging ? 0.5 : updatingId === bug._id ? 0.6 : 1,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Open ${bug.title}`}
    >
      <p className="kanban-card-title">{bug.title}</p>
      {bug.description && <p className="kanban-card-desc">{bug.description}</p>}
      <div className="kanban-card-meta">
        <span className="kanban-card-badge" style={{ background: `${STATUS_COLOR[status] || "#64748b"}22`, color: STATUS_COLOR[status] || "#64748b" }}>
          {status}
        </span>
        <span className="kanban-card-priority" style={{ color: PRIORITY_COLOR[priority] }}>
          ↑ {priority}
        </span>
      </div>
    </div>
  );
}

function DroppableColumn({ column, bugs, updatingId, activeId, onOpenDetails, refresh, justDragged }) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const count = bugs.length;
  return (
    <div
      ref={setNodeRef}
      data-column-id={column.id}
      className="kanban-column"
      style={{
        background: isOver ? "var(--accent-dim)" : "var(--bg-surface)",
        borderColor: isOver ? "var(--primary)" : "var(--border)",
      }}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-title">{column.title}</span>
        <span className="kanban-column-count">{count}</span>
      </div>
      <div className="kanban-column-cards">
        {bugs.map((bug) => (
          <KanbanCard
            key={bug._id}
            bug={bug}
            isDragging={activeId === bug._id}
            updatingId={updatingId}
            onOpenDetails={onOpenDetails}
            justDragged={justDragged}
          />
        ))}
      </div>
    </div>
  );
}

function Kanban() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const justDragged = useRef(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/bugs", { params: { limit: 200 } });
      const data = res.data;
      setBugs(data.bugs ?? (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error(e);
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 300);
    if (!over || !active) return;

    const bugId = active.id;
    const targetStatus = over.id;

    const colIds = COLUMNS.map((c) => c.id);
    if (!colIds.includes(targetStatus)) return;

    const bug = bugs.find((b) => b._id === bugId);
    if (!bug || bug.status === targetStatus) return;

    setUpdatingId(bugId);
    try {
      const res = await API.put(`/bugs/${bugId}`, { status: targetStatus });
      const updated = res.data;
      setBugs((prev) => prev.map((b) => (b._id === bugId ? updated : b)));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const openBugDetails = (bugId) => {
    navigate(`/bugs/${bugId}`, { state: { fromKanban: true } });
  };

  const byStatus = (status) => bugs.filter((b) => (b.status || "open") === status);

  return (
    <AppLayout>
      <div className="dashboard-header">
        <h1>Kanban Board</h1>
        <p>Drag bugs across columns to update status in real time.</p>
      </div>
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="kanban-wrap">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col.id}
                column={col}
                bugs={byStatus(col.id)}
                updatingId={updatingId}
                activeId={activeId}
                onOpenDetails={openBugDetails}
                refresh={load}
                justDragged={justDragged}
              />
            ))}
          </div>
        </DndContext>
        </div>
      )}
    </AppLayout>
  );
}

export default Kanban;

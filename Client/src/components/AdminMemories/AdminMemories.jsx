import React, { useEffect, useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { postsAPI } from "../../services/apiServices";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import EventForm from "./EventForm/EventForm";
import EventList from "./EventList/EventList";
import PreviewModal from "./Modals/PreviewModal";
import ImageModal from "./Modals/ImageModal";
import "../../assets/Css/AdminMemories.css";

function AdminMemories() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate ();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ content: "", fileIds: [] });
  const [editingId, setEditingId] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await postsAPI.getEventPosts();
      setEvents(res.data.posts || res.data.Posts || []);
    } catch (err) {
      toast.error("Échec de la récupération des événements.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmitSuccess = () => {
    setForm({ content: "", fileIds: [] });
    setFiles([]);
    setProgress(0);
    setEditingId(null);
    fetchEvents();
    toast.success("Publication d'événement soumise avec succès.");
  };

  const handleEdit = (event) => {
    setForm({
      content: event.content,
      fileIds: event.fileIds || []
    });
    setEditingId(event.id || event.Id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;
    setError("");
    try {
      await postsAPI.deleteEventPost(id);
      fetchEvents();
      toast.success("Événement supprimé avec succès.");
    } catch (err) {
      toast.error("Échec de la suppression de l'événement.");
    }
  };

  return (
    <div className="admin-memories-container" tabIndex="0" aria-label="Section de gestion des événements d'administration">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <motion.button
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
            className="btn-back-arrow"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginRight: '12px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem',
              color: 'var(--primary)',
              outline: 'none'
            }}
            whileHover={{ scale: 1.15, color: '#173b61' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span style={{ marginLeft: '6px', fontSize: '1rem' }}></span>
          </motion.button></div>
      <h2 className="admin-title" tabIndex="0">Gestion des souvenirs de l'équipes</h2>
      <EventForm
        form={form}
        setForm={setForm}
        files={files}
        setFiles={setFiles}
        progress={progress}
        setProgress={setProgress}
        uploading={uploading}
        setUploading={setUploading}
        editingId={editingId}
        userId={userId}
        role={user?.role}
        onSubmitSuccess={handleSubmitSuccess}
        onPreview={() => setIsPreviewOpen(true)}
        onCancelEdit={() => {
          setEditingId(null);
          setForm({ content: "", fileIds: [] });
          setFiles([]);
          setProgress(0);
        }}
      />
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        form={form}
        files={files}
        onSubmit={() => {
          setIsPreviewOpen(false);
          const submitEvent = new Event('submit');
          document.querySelector('.event-form').dispatchEvent(submitEvent);
        }}
      />
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      <EventList
        events={events}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImageSelect={setSelectedImage}
      />
    </div>
  );
}

export default AdminMemories;
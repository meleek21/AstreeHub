import React, { useRef } from "react";
import { toast } from "react-hot-toast";
import {postsAPI} from "../../../services/apiServices";
import FileUpload from "./FileUpload";
import FileToolbar from "./FileToolbar";
import FormActions from "./FormActions";

function EventForm({
  form,
  setForm,
  files,
  setFiles,
  progress,
  setProgress,
  uploading,
  setUploading,
  editingId,
  userId,
  role,
  onSubmitSuccess,
  onPreview,
  onCancelEdit
}) {
  const inputRef = useRef(null);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setProgress(0);
    try {
      let uploadedFileIds = [];
      if (files.length > 0) {
        uploadedFileIds = await uploadFilesToBackend();
      }
      const eventData = {
        ...form,
        fileIds: uploadedFileIds,
        AuthorId: userId
      };
      
      if (!eventData.content.trim() && eventData.fileIds.length === 0) {
        toast.error("Veuillez ajouter du contenu ou sélectionner des fichiers à télécharger.");
        setUploading(false);
        return;
      }
      
      if (editingId) {
        await postsAPI.updateEventPost(editingId, eventData);
        toast.success("Événement mis à jour avec succès.");
      } else {
        await postsAPI.addEventPost(eventData);
        toast.success("Événement ajouté avec succès.");
      }
      
      onSubmitSuccess();
    } catch (error) {
      toast.error("Échec de la soumission de la publication d'événement.");
    } finally {
      setUploading(false);
    }
  };

  const uploadFilesToBackend = async () => {
    const uploadedFiles = [];
    let uploadedCount = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append("files", file);
      try {
        const response = await postsAPI.uploadFile(formData);
        if (Array.isArray(response.data) && response.data.length > 0) {
          const fileData = response.data[0];
          if (fileData.id && fileData.fileUrl) {
            uploadedFiles.push(fileData.id);
          }
        }
        uploadedCount++;
        setProgress(Math.round((uploadedCount / files.length) * 100));
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Échec du téléchargement du fichier.");
        throw error;
      }
    }
    return uploadedFiles;
  };

  const handleBrowseClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    } else {
      console.error('inputRef is not initialized');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form">
      <input
        type="text"
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="Partagez les détails de votre événement..."
        required={files.length === 0}
        className="content-textarea"
      />
      
      {role === 'SUPERADMIN' && (
        <FileToolbar 
          files={files}
          progress={progress}
          onClear={() => {
            setFiles([]);
            setProgress(0);
          }}
          handleBrowseClick={handleBrowseClick}
        />
      )}
      
      <FileUpload 
        files={files}
        setFiles={setFiles}
        inputRef={inputRef}
        handleBrowseClick={handleBrowseClick}
      />
      
      <FormActions
        uploading={uploading}
        loading={false}
        editingId={editingId}
        onPreview={onPreview}
        onCancelEdit={onCancelEdit}
      />
    </form>
  );
}

export default EventForm;


import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { postsAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import PostEditorModal from "./PostEditorModal";
import "../assets/Css/CreatePost.css";

const placeholderPhrases = [
  "Qu'avez-vous en tête aujourd'hui ?",
  "Partagez votre idée avec le monde !",
  "Une pensée à exprimer ? Écrivez-la ici...",
  "Exprimez votre créativité...",
  "Dites quelque chose d'inspirant !",
];

const CreatePost = ({ channelId }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const { user } = useAuth();
  const userId = user?.id;
  const isDirector = user?.role === "DIRECTOR";
  const isChannelPost = Boolean(channelId);

  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    setPlaceholder(placeholderPhrases[Math.floor(Math.random() * placeholderPhrases.length)]);
  }, []);

  const saveDraft = () => {
    localStorage.setItem("draftPost", content);
    toast.success("Brouillon enregistré !");
  };

  const deleteDraft = () => {
    localStorage.removeItem("draftPost");
    setContent("");
    toast.success("Brouillon supprimé !");
  };

  const handleSubmit = async (postData) => {
    setIsSubmitting(true);

    try {
      const requestBody = {
        content: postData.content || "",
        authorId: userId,
        isPublic: true,
        fileUrls: postData.fileUrls || [],
        fileIds: postData.fileIds || [],
      };

      console.log("Request Body:", requestBody);

      const response = isChannelPost
        ? await postsAPI.createChannelPost(channelId, requestBody)
        : await postsAPI.createPost(requestBody);
      console.log("Publication créée :", response.data);
      toast.success("Publication créée avec succès !");
      setContent("");
      setFiles([]);
      localStorage.removeItem("draftPost");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création de la publication :", error.response?.data || error.message);
      if (error.response?.data?.errors) {
        console.error("Validation Errors:", error.response.data.errors);
      }
      toast.error(error.response?.data?.message || "Une erreur s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChannelPost && !isDirector) {
    return (
      <div className="create-post-container create-post-restricted-wrapper">
        <div className="create-post-restricted">
          <p>BIENVENUE DANS LE CANAL OFFICIEL DU DEPARTEMENT</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="create-post-container">
        {user && (
          <a href={user.id ? `/profile/view/${user.id}` : undefined} className="create-post-profile-link">
            <img
              src={user.profilePictureUrl || "https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg"}
              alt="Profile"
              className="create-post-profile-pic"
            />
          </a>
        )}
        <input
          type="text"
          placeholder={isChannelPost ? "Créer une annonce officielle..." : placeholder}
          onClick={() => setIsModalOpen(true)}
          readOnly
          className="create-post-input"
        />
      </div>

      <PostEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        content={content}
        setContent={setContent}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        saveDraft={saveDraft}
        deleteDraft={deleteDraft}
        files={files}
        setFiles={setFiles}
        channelId={channelId}
      />
    </>
  );
};

export default CreatePost;
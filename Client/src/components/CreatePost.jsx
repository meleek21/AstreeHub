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

const validateContent = (content) => {
    if (!content || content.length < 10) {
        toast.error("Le contenu doit contenir au moins 10 caractères.");
        return false;
    }
    return true;
};

const CreatePost = () => {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const userId = user?.id;

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

    const handleSubmit = async () => {
        setIsSubmitting(true);

        if (!validateContent(content)) {
            setIsSubmitting(false);
            return;
        }

        const requestBody = {
            content: content,
            authorId: userId,
            isPublic: true,
            scheduledTime: scheduledTime || null,
        };

        try {
            const response = await postsAPI.createPost(requestBody);
            console.log("Publication créée :", response.data);
            toast.success(scheduledTime ? "Publication planifiée !" : "Publication créée avec succès !");
            setContent("");
            setScheduledTime(null);
            localStorage.removeItem("draftPost");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erreur lors de la création de la publication :", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Une erreur s'est produite.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="create-post-container">
                <input
                    type="text"
                    placeholder={placeholder}
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
                scheduledTime={scheduledTime}
                setScheduledTime={setScheduledTime}
                saveDraft={saveDraft}
                deleteDraft={deleteDraft}
            />
        </>
    );
};

export default CreatePost;
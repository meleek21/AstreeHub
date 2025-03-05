import React, { useState } from 'react';
import { postsAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast'; // Import react-hot-toast

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const userId = user?.id;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Vérifier que le contenu respecte la longueur minimale
        if (content.length < 10) {
            toast.error("Le contenu doit contenir au moins 10 caractères."); // Toast for validation error
            setIsSubmitting(false);
            return;
        }

        const requestBody = {
            content: content,
            authorId: userId,
            isPublic: true,
            tags: [],
            documents: [],
            reactionCounts: {},
            userReaction: "Like",
            comments: [],
            reactions: {},
            timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log("Corps de la requête :", requestBody); // Journaliser le corps de la requête

        try {
            const response = await postsAPI.createPost(requestBody);
            console.log('Publication créée :', response.data);
            toast.success("Publication créée avec succès !"); // Toast for success
            setContent(''); // Réinitialiser le champ de texte après la soumission
        } catch (error) {
            console.error('Erreur lors de la création de la publication :', error.response?.data || error.message);
            if (error.response?.data?.errors) {
                // Afficher les erreurs de validation à l'utilisateur
                toast.error("Erreurs de validation : " + JSON.stringify(error.response.data.errors, null, 2)); // Toast for validation errors
            } else {
                toast.error("Une erreur s'est produite lors de la création de la publication."); // Toast for generic error
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Créer une Publication</h1>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez votre publication ici..."
                required
                disabled={isSubmitting}
            />
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : "Soumettre"}
            </button>
        </form>
    );
};

export default CreatePost;
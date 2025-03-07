import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';

// Helper function to validate content
const validateContent = (content) => {
    if (content.length < 10) {
        toast.error("Le contenu doit contenir au moins 10 caractères.");
        return false;
    }
    return true;
};

// CreatePostForm component
const CreatePostForm = ({ content, setContent, isSubmitting, handleSubmit, isScrolled }) => {
    return (
        <form
            onSubmit={handleSubmit}
            className={`create-post-form ${isScrolled ? 'scrolled' : ''}`}
            style={{
                padding: isScrolled ? '10px' : '20px',
                borderRadius: isScrolled ? '6px' : '8px',
                boxShadow: isScrolled ? '0 2px 5px rgba(0, 0, 0, 0.1)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
            }}
        >
            <h1 style={{ fontSize: isScrolled ? '1.2rem' : '1.5rem' }}>Créer une Publication</h1>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez votre publication ici..."
                required
                disabled={isSubmitting}
                aria-label="Écrivez votre publication ici"
                style={{
                    minHeight: isScrolled ? '60px' : '80px',
                    fontSize: isScrolled ? '0.8rem' : '0.9rem',
                }}
            />
            <button
                type="submit"
                disabled={isSubmitting}
                aria-label="Soumettre la publication"
                style={{
                    padding: isScrolled ? '8px' : '10px',
                    fontSize: isScrolled ? '0.9rem' : '1rem',
                }}
            >
                {isSubmitting ? "Envoi en cours..." : "Soumettre"}
            </button>
        </form>
    );
};

// Main CreatePost component
const CreatePost = () => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { user } = useAuth();
    const userId = user?.id;

    // Add scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate content
        if (!validateContent(content)) {
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

        console.log("Corps de la requête :", requestBody);

        try {
            const response = await postsAPI.createPost(requestBody);
            console.log('Publication créée :', response.data);
            toast.success("Publication créée avec succès !");
            setContent('');
        } catch (error) {
            console.error('Erreur lors de la création de la publication :', error.response?.data || error.message);
            if (error.response?.data?.errors) {
                toast.error("Erreurs de validation : " + JSON.stringify(error.response.data.errors, null, 2));
            } else {
                toast.error("Une erreur s'est produite lors de la création de la publication.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CreatePostForm
            content={content}
            setContent={setContent}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            isScrolled={isScrolled}
        />
    );
};

export default CreatePost;
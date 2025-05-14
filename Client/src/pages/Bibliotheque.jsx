import React, { useEffect, useState, useRef } from 'react';
import FileUpload from '../components/FileUpload';
import { libraryAPI } from '../services/apiServices';
import { motion } from 'framer-motion';
import '../assets/Css/Bibliotheque.css';
import ModalPortal from '../components/ModalPortal';

function Bibliotheque() {
  const [libraryPosts, setLibraryPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastItemId, setLastItemId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);
  const [expandedImage, setExpandedImage] = useState(null);

  // Fetch library posts with pagination
  const fetchLibraryPosts = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      const currentLastItemId = isInitial ? null : lastItemId;
      const response = await libraryAPI.GetLibraryPosts(currentLastItemId);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      const { posts: fetchedPosts = [], NextLastItemId, HasMore } = response.data;
      if (!Array.isArray(fetchedPosts)) {
        setLibraryPosts([]);
        setError('Invalid data format received.');
        return;
      }
      setLibraryPosts((prevPosts) => (isInitial ? fetchedPosts : [...prevPosts, ...fetchedPosts]));
      setLastItemId(NextLastItemId);
      setHasMore(HasMore);
    } catch (err) {
      setError('Failed to load library posts. Please try again later.');
      setLibraryPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLibraryPosts(true);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchLibraryPosts(false);
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

  const getFileIconClass = (fileType) => {
    if (fileType === 'application/pdf') return 'file-icon pdf';
    if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'file-icon word';
    if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'file-icon excel';
    return 'file-icon generic';
  };

  const renderFile = (file) => {
    const { fileUrl, fileName, fileType } = file;
    if (fileType?.startsWith('image/')) {
      return (
        <motion.div
          className="bibliotheque-image-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => setExpandedImage(fileUrl)}
        >
          <motion.img
            src={fileUrl}
            alt={fileName}
            className="bibliotheque-image"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <p className="bibliotheque-image-name">{fileName}</p>
        </motion.div>
      );
    } else {
      return (
        <div className="bibliotheque-file-card">
          <span className={getFileIconClass(fileType)}></span>
          <div className="bibliotheque-file-details">
            <a
              href={fileUrl}
              target={fileType === 'application/pdf' ? '_blank' : undefined}
              rel="noopener noreferrer"
              download={fileType !== 'application/pdf' ? fileName : undefined}
              className="bibliotheque-file-link"
            >
              {fileName}
            </a>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="bibliotheque-container">
      <FileUpload />
      <hr />
      {loading && <p>Loading library posts...</p>}
      {error && <p className="bibliotheque-error">{error}</p>}
      {!loading && !error && (
        <div>
          {Array.isArray(libraryPosts) && libraryPosts.length === 0 ? (
            <p>No library posts found.</p>
          ) : (
            <ul className="bibliotheque-list">
              {Array.isArray(libraryPosts) && libraryPosts.map((post) => (
                <li key={post.id} className="bibliotheque-card">
                  <p className="bibliotheque-description">{post.content || ''}</p>
                  {post.files && Array.isArray(post.files) && post.files.length > 0 && (
                    <div className="bibliotheque-files">
                      <ul className="bibliotheque-files-list">
                        {post.files.map((file) => (
                          <li key={file.id} className="bibliotheque-file-item">
                            {renderFile(file)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div ref={observerTarget} className="bibliotheque-infinite-scroll-trigger" />
          {loadingMore && <p>Loading more...</p>}
        </div>
      )}
      {expandedImage && (
        <ModalPortal>
          <div className="bibliotheque-image-modal" onClick={() => setExpandedImage(null)}>
            <img src={expandedImage} alt="Expanded" className="bibliotheque-image-expanded" />
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default Bibliotheque;
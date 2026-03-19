/**
 * Review Modal Component
 * Modal for submitting product reviews
 */

'use client';

import React, { useState } from 'react';
import ReviewService, { CreateReviewDto } from '@/services/ReviewService';
import AuthService from '@/services/AuthService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  productImage?: string;
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const currentUser = AuthService.getCurrentUser();
      const reviewerName = currentUser?.firstName && currentUser?.lastName
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser?.email || 'Anonymous';

      const reviewData: CreateReviewDto = {
        productId,
        reviewerName,
        rating,
        comment: comment.trim(),
      };

      const result = await ReviewService.createReview(reviewData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
          if (onReviewSubmitted) {
            onReviewSubmitted();
          }
        }, 1500);
      } else {
        setError(result.message || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError('An error occurred while submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa fa-star me-2"></i>Write a Review
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={submitting}
            ></button>
          </div>
          <div className="modal-body">
            {success ? (
              <div className="text-center py-4">
                <i className="fa fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 text-success">Thank you for your review!</h5>
                <p className="text-muted">Your review has been submitted successfully.</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    {productImage && (
                      <img
                        src={productImage}
                        alt={productName}
                        className="img-thumbnail me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <h6 className="mb-0">{productName}</h6>
                      <small className="text-muted">Product ID: {productId}</small>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">
                      Rating <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex align-items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-link p-0 me-1"
                          onClick={() => setRating(star)}
                          disabled={submitting}
                          style={{
                            border: 'none',
                            background: 'none',
                            fontSize: '2rem',
                            color: star <= rating ? '#ffc107' : '#ddd',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <i className="fa fa-star"></i>
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ms-2 text-muted">
                          {rating} {rating === 1 ? 'star' : 'stars'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reviewComment" className="form-label">
                      Your Review <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="reviewComment"
                      className="form-control"
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      disabled={submitting}
                      required
                    />
                    <small className="text-muted">
                      {comment.length}/500 characters
                    </small>
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <i className="fa fa-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleClose}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || rating === 0 || !comment.trim()}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane me-2"></i>
                          Submit Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

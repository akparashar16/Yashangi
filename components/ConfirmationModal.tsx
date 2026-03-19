/**
 * Confirmation Modal Component
 * Custom confirmation dialog using Bootstrap modal
 */

'use client';

import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  show: boolean;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  id,
  title,
  message,
  confirmText = 'Yes, Remove',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  show,
  onClose,
}) => {
  const cleanupBackdrop = () => {
    // Remove any lingering backdrop
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body classes
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  useEffect(() => {
    const modalElement = document.getElementById(id);
    if (!modalElement) return;

    if (show) {
      // Show modal using Bootstrap
      const bsModal = new (window as any).bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
      });
      bsModal.show();

      // Handle modal hidden event
      const handleHidden = () => {
        cleanupBackdrop();
        onClose();
      };
      modalElement.addEventListener('hidden.bs.modal', handleHidden);

      return () => {
        modalElement.removeEventListener('hidden.bs.modal', handleHidden);
      };
    } else {
      // Hide modal
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (bsModal) {
        bsModal.hide();
      }
      // Clean up backdrop
      cleanupBackdrop();
    }
  }, [show, id, onClose]);

  const handleConfirm = () => {
    const modalElement = document.getElementById(id);
    if (modalElement) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (bsModal) {
        bsModal.hide();
      }
    }
    // Clean up backdrop immediately and call onConfirm
    cleanupBackdrop();
    onConfirm();
  };

  const handleCancel = () => {
    const modalElement = document.getElementById(id);
    if (modalElement) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (bsModal) {
        bsModal.hide();
      }
    }
    // Clean up backdrop immediately
    cleanupBackdrop();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div
      id={id}
      className="modal fade"
      tabIndex={-1}
      role="dialog"
      aria-labelledby={`${id}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title" id={`${id}Label`}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCancel}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body text-center py-4">
            <div className="mb-3">
              <i className="fa fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
            </div>
            <p className="mb-0" style={{ fontSize: '1.1rem' }}>
              {message}
            </p>
          </div>
          <div className="modal-footer border-top-0 justify-content-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

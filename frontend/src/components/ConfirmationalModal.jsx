import React, { useEffect, useRef } from 'react';
import './ModalStyles.css'; // or wherever you put the CSS

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    // Auto-focus cancel button for safety
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-buttons">
          <button
            className="modal-button cancel"
            onClick={onCancel}
            ref={cancelButtonRef}
          >
            Cancel
          </button>
          <button className="modal-button confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

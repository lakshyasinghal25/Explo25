import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './SentenceEditor.css';

const SentenceEditor = ({ 
  sourceSentence, 
  targetSentence, 
  onSave, 
  onCancel 
}) => {
  const [editableSourceSentence, setEditableSourceSentence] = useState(sourceSentence);
  const [editableTargetSentence, setEditableTargetSentence] = useState(targetSentence);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editableSourceSentence.trim() === '' || editableTargetSentence.trim() === '') {
      alert('Source and target sentences cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editableSourceSentence, editableTargetSentence);
    } catch (error) {
      console.error('Error saving sentences:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sentence-editor">
      <div className="editor-container">
        <div className="source-editor">
          <h3>Edit Source Text</h3>
          <textarea
            value={editableSourceSentence}
            onChange={(e) => setEditableSourceSentence(e.target.value)}
            className="edit-textarea"
            rows={4}
            placeholder="Enter source sentence"
          />
        </div>
        
        <div className="target-editor">
          <h3>Edit Target Text</h3>
          <textarea
            value={editableTargetSentence}
            onChange={(e) => setEditableTargetSentence(e.target.value)}
            className="edit-textarea"
            rows={4}
            placeholder="Enter target sentence"
          />
        </div>
      </div>

      <div className="editor-controls">
        <button 
          onClick={handleSave}
          className="save-button"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          onClick={onCancel}
          className="cancel-button"
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

SentenceEditor.propTypes = {
  sourceSentence: PropTypes.string.isRequired,
  targetSentence: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default SentenceEditor;
import React, { useState, useEffect, useRef, use } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Stage, Layer, Line } from 'react-konva';
import apiClient from '../services/api';
import SentenceEditor from './SentenceEditor';
import './AlignmentInterface.css';
import ConfirmationalModal from './ConfirmationalModal';

const AlignmentInterface = () => {
  const [sentencePairs, setSentencePairs] = useState([]);
  const [currentPairId, setCurrentPairId] = useState(1);
  const [sourceText, setSourceText] = useState([]);
  const [targetText, setTargetText] = useState([]);
  const [alignments, setAlignments] = useState([]);
  const [linePoints, setLinePoints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSourceSentence, setCurrentSourceSentence] = useState('');
  const [currentTargetSentence, setCurrentTargetSentence] = useState('');
  const [showModalClear, setShowModalClear] = useState(false);
  const [showModalReset, setShowModalReset] = useState(false);
  const [alignmentMode, setAlignmentMode] = useState("drag");
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(null);


  const sourceRefs = useRef([]);
  const targetRefs = useRef([]);
  const stageRef = useRef(null);

  useEffect(() => {
    const points = alignments.map(({ source_indices, target_indices }) => {
      const sourcePos = getWordCenter(sourceRefs.current[source_indices[0]], "source");
      const targetPos = getWordCenter(targetRefs.current[target_indices[0]], "target");
      return { from: sourcePos, to: targetPos };
    });
    // console.log('Line points:', points);
    setLinePoints(points);
  }, [alignments, sourceText, targetText]);

  useEffect(() => {
    if (
      alignmentMode === "select" &&
      selectedSourceIndex !== null &&
      selectedTargetIndex !== null
    ) {
      handleDrop(
        { index: selectedSourceIndex, lang: "source" },
        selectedTargetIndex,
        "target"
      );
      setSelectedSourceIndex(null);
      setSelectedTargetIndex(null);
    }
  }, [selectedSourceIndex, selectedTargetIndex]);
  
  
  useEffect(() => {
    const fetchSentencePairs = async () => {
      try {
        const response = await apiClient.get('/sentence-pairs/');
        setSentencePairs(response.data);
        if (response.data.length > 0) {
          fetchSentencePair(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching sentence pairs:', error);
      }
    };
    fetchSentencePairs();
  }, []);

  const fetchSentencePair = async (pairId) => {
    try {
      const response = await apiClient.get(`/sentence-pairs/${pairId}/`);
      setSourceText(response.data.source_sentence.split(' '));
      setTargetText(response.data.target_sentence.split(' '));
      setAlignments(response.data.alignments || []);
      setCurrentPairId(pairId);
      setCurrentSourceSentence(response.data.source_sentence);
      setCurrentTargetSentence(response.data.target_sentence);
    } catch (error) {
      console.error('Error fetching sentence pair:', error);
    }
  };

  const toggleMode = () => {
    setAlignmentMode(prevMode => (prevMode === "drag" ? "select" : "drag"));
  };
  
  const handleDrop = (draggedItem, targetIndex, targetLang) => {
    // Extract source & target indices based on the dragged item's language
    
    const sourceIndex = draggedItem.lang === 'source' ? draggedItem.index : targetIndex;
    const targetIndexFinal = draggedItem.lang === 'target' ? draggedItem.index : targetIndex;

    const existingAlignmentIndex = alignments.findIndex(alignment =>
      alignment.source_indices.includes(sourceIndex) &&
      alignment.target_indices.includes(targetIndexFinal)
    );

    if (existingAlignmentIndex !== -1) {
        // Remove the existing alignment
        const alignmentToRemove = alignments[existingAlignmentIndex];
        console.log("Removing existing alignment:", alignmentToRemove);

        // Update the state to remove the alignment
        setAlignments(prevAlignments =>
            prevAlignments.filter((_, index) => index !== existingAlignmentIndex)
        );

        // Remove the alignment from the backend
        apiClient.delete(`/alignments/${alignmentToRemove.id}/`)
            .then(() => {
              console.log("Alignment removed from backend");
            })
            .catch(error => console.error("Error removing alignment from backend:", error));

        return; // Exit after removing the alignment
    }

    const newAlignment = {
        source_indices: [sourceIndex],
        target_indices: [targetIndexFinal],
        sentence_pair_id: currentPairId,
    };

    setAlignments(prevAlignments => [...prevAlignments, newAlignment]);

    apiClient.post('/alignments/', newAlignment)
      .then(response => {
          console.log("Alignment saved:", response.data);
          setAlignments(prevAlignments =>
              prevAlignments.map(alignment =>
                  alignment === newAlignment ? { ...alignment, id: response.data.id } : alignment
              )
          );
      })
      .catch(error => {
        console.error('Error saving alignment:', error);
      });
  };


  const DraggableDroppableWord = ({ word, index, lang, onDrop }) => {
    const ref = useRef(null);
  
    // Drag logic
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'WORD',
      item: { word, index, lang },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));
  
    // Drop logic
    const [, drop] = useDrop(() => ({
      accept: "WORD",
      drop: (item) => {
        console.log(`Dropped '${item.word}' from ${item.lang} onto ${word} in ${lang}`);
        
        if (item.lang !== lang) {
          onDrop(item, index, lang);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));
    
  
    drag(drop(ref)); // Combine drag and drop
    const isSelected =
  (lang === "source" && selectedSourceIndex === index) ||
  (lang === "target" && selectedTargetIndex === index);
  
    return (
      <div
        ref={ref}
        className="word"
        style={{
          opacity: isDragging ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
          backgroundColor: isSelected ? "#ddd" : undefined,
          border: isSelected ? "2px solid grey" : undefined,
        }}
        onClick={() => {
          if (alignmentMode !== "select") return;
          if (lang === "source"){
            if(index === selectedSourceIndex) setSelectedSourceIndex(null);
            else setSelectedSourceIndex(index);
          }
          else{
            if(index === selectedTargetIndex) setSelectedTargetIndex(null);    
            else setSelectedTargetIndex(index);
          }
        }}
      >
        {word}
      </div>
    );
  };
  
  const getWordCenter = (ref, lang) => {
    const rect = ref?.getBoundingClientRect();
    const stageRect = stageRef.current?.container().getBoundingClientRect();
    // console.log('ref', ref);
    if (!rect || !stageRect) return { x: 0, y: 0 };
    
    if(lang === "source") return {
      x: 50 + rect.left + rect.width / 2 - stageRect.left,
      y: rect.top + rect.height / 2 - stageRect.top,
    };
    else return {
      x: rect.left + rect.width / 2 - stageRect.left - 50,
      y: rect.top + rect.height / 2 - stageRect.top,
    };
  };

  // Edit functionality
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (updatedSourceSentence, updatedTargetSentence) => {
    try {
      // Update the sentence pair on the server
      const response = await apiClient.put(`/sentence-pairs/${currentPairId}/`, {
        source_sentence: updatedSourceSentence,
        target_sentence: updatedTargetSentence,
      });
      
      console.log('Sentence pair updated:', response.data);
      
      // Update the local state
      setSourceText(updatedSourceSentence.split(' '));
      setTargetText(updatedTargetSentence.split(' '));
      setCurrentSourceSentence(updatedSourceSentence);
      setCurrentTargetSentence(updatedTargetSentence);
      
      // Clear alignments as they might no longer be valid
      setAlignments([]);
      
      // Refresh the sentence pairs list
      const pairsResponse = await apiClient.get('/sentence-pairs/');
      setSentencePairs(pairsResponse.data);
      
      setIsEditing(false);
      return true;
    } catch (error) {
      console.error('Error updating sentence pair:', error);
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const goToFirstPair = () => {
    if (sentencePairs.length > 0) {
      fetchSentencePair(sentencePairs[0].id);
    }
  };
  
  const goToPreviousPair = () => {
    const currentIndex = sentencePairs.findIndex(pair => pair.id === currentPairId);
    if (currentIndex > 0) {
      fetchSentencePair(sentencePairs[currentIndex - 1].id);
    }
  };
  
  const goToNextPair = () => {
    const currentIndex = sentencePairs.findIndex(pair => pair.id === currentPairId);
    if (currentIndex < sentencePairs.length - 1) {
      fetchSentencePair(sentencePairs[currentIndex + 1].id);
    }
  };
  
  const goToLastPair = () => {
    if (sentencePairs.length > 0) {
      fetchSentencePair(sentencePairs[sentencePairs.length - 1].id);
    }
  };
  
  const handleClearClick = () => {
    setShowModalClear(true);
  };
  const cancelClear = () => {
    setShowModalClear(false);
  };
  const handleResetClick = () => {
    setShowModalReset(true);
  };
  const cancelReset = () => {
    setShowModalReset(false);
  };

  const handleClearCurrentAlignments = async () => {
    try {
      const alignmentIds = alignments.map(a => a.id);
      for (let id of alignmentIds) {
        await apiClient.delete(`/alignments/${id}/`);
      }
      setAlignments([]);
      console.log("All current alignments cleared.");
    } catch (error) {
      console.error("Error clearing current alignments:", error);
    }
    setShowModalClear(false);
  };
  
  const handleResetAllAlignments = async () => {
    try {
      await apiClient.delete('/alignments/reset-all/'); // Assuming your backend has this route
      setAlignments([]);
      fetchSentencePair(currentPairId); // Refresh current sentence pair
      console.log("All alignments reset.");
    } catch (error) {
      console.error("Error resetting all alignments:", error);
    }
    setShowModalReset(false);
  };
  

  return (
    <div className="alignment-interface">
      <h2>Word Alignment Tool</h2>

      <div className="sentence-selector">
        <div>
          <label htmlFor="sentence-pair">Select Sentence Pair: </label>
          <select 
            id="sentence-pair"
            value={currentPairId}
            onChange={(e) => fetchSentencePair(parseInt(e.target.value))}
            disabled={isEditing}
          >
            {sentencePairs.map(pair => (
              <option key={pair.id} value={pair.id}>
                {pair.source_language} → {pair.target_language}: {pair.source_sentence.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>        
        {!isEditing && (
          <div className='edit-controls'>
            <span className="edit-warning">⚠️ Editing will remove all the existing alignments hence edit at start</span>  
            <button 
              onClick={handleEditClick}
              className="editbutton"
            >
              Edit Sentences
            </button>
          
            <button onClick={toggleMode} className="primary-button">
              Switch to {alignmentMode === "drag" ? "Select Mode" : "Drag-and-Drop Mode"}
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <SentenceEditor 
          sourceSentence={currentSourceSentence}
          targetSentence={currentTargetSentence}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <>
      <div className="text-containers">
        <div className="source-container">
          <div className="heading"><h3>Source Text</h3></div>
          {sourceText.map((word, index) => (
            <div ref={el => sourceRefs.current[index] = el} key={index}>
              <DraggableDroppableWord
                word={word}
                index={index}
                lang="source"
                onDrop={handleDrop}
              />
            </div>
          ))}
        </div>

        <div className="target-container">
        <div className="heading"><h3>Target Text</h3></div>
          {targetText.map((word, index) => (
            <div ref={el => targetRefs.current[index] = el} key={index}>
              <DraggableDroppableWord
                word={word}
                index={index}
                lang="target"
                onDrop={handleDrop}
              />
            </div>
          ))}
        </div>
      </div>


      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Layer>
          {linePoints.map((line, idx) => (
            <Line
              key={idx}
              points={[line.from.x, line.from.y, line.to.x, line.to.y]}
              stroke="red"
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
      
      <div className="options">
        <div className="controls">
          <button onClick={goToFirstPair} disabled={isEditing}>⏮ First Sentence</button>
          <button onClick={goToPreviousPair} disabled={isEditing}>◀ Previous Sentence</button>
          <button onClick={goToNextPair} disabled={isEditing}>Next Sentence ▶</button>
          <button onClick={goToLastPair} disabled={isEditing}>Last Sentence ⏭</button>
        </div>
        <div className="reset">
          <button onClick={handleClearClick}>Clear Alignments</button>
            {showModalClear && (
              <ConfirmationalModal
                message="Are you sure you want to clear all alignments for the current sentence pair?"
                onConfirm={handleClearCurrentAlignments}
                onCancel={cancelClear}
              />
            )}
          <button className="delete-button" onClick={handleResetClick}> Reset All Alignments </button>
            {showModalReset && (
                <ConfirmationalModal
                  message="This will delete all alignments across all sentence pairs. Are you absolutely sure?"
                  onConfirm={handleResetAllAlignments}
                  onCancel={cancelReset}
                />
              )}
        </div>
      </div>

      </>)}
    </div>
  );
};

export default AlignmentInterface;
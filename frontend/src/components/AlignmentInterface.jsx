// src/components/AlignmentInterface.jsx
import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import apiClient from '../services/api';
import './AlignmentInterface.css';

const AlignmentInterface = () => {
  const [sourceText, setSourceText] = useState([]);
  const [targetText, setTargetText] = useState([]);
  const [alignments, setAlignments] = useState([]);
  const [selectedSourceIndices, setSelectedSourceIndices] = useState([]);
  const [selectedTargetIndices, setSelectedTargetIndices] = useState([]);
  const [sentencePairs, setSentencePairs] = useState([]);
  const [currentPairId, setCurrentPairId] = useState(1);

  useEffect(() => {
    const fetchSentencePairs = async () => {
      try {
        console.log('Fetching sentence pairs...');
        const response = await apiClient.get('/sentence-pairs/');
        console.log('Response:', response.data);
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
      const { source_sentence, target_sentence } = response.data;
      
      setSourceText(source_sentence.split(' '));
      setTargetText(target_sentence.split(' '));
      
      // Clear previous alignments
      setAlignments(response.data.alignments || []);
      setSelectedSourceIndices([]);
      setSelectedTargetIndices([]);
      setCurrentPairId(pairId);
    } catch (error) {
      console.error('Error fetching sentence pair:', error);
    }
  };

  // Handle source word selection
  const toggleSourceWord = (index) => {
    setSelectedSourceIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Handle target word selection
  const toggleTargetWord = (index) => {
    setSelectedTargetIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Create alignment between selected words/phrases
  // In your AlignmentInterface.jsx
  const createAlignment = () => {
    if (selectedSourceIndices.length === 0 || selectedTargetIndices.length === 0) {
      return;
    }
    
    const newAlignment = {
      source_indices: [...selectedSourceIndices].sort((a, b) => a - b),
      target_indices: [...selectedTargetIndices].sort((a, b) => a - b),
      sentence_pair_id: currentPairId // Make sure this matches your serializer field
    };
    
    setAlignments(prev => [...prev, {...newAlignment, id: Date.now()}]);
    
    // Add this before the apiClient.post call
    console.log('Sending alignment data:', newAlignment);
    // Save to backend
    apiClient.post('/alignments/', newAlignment)
      .then(response => {
        console.log('Alignment saved:', response.data);
        // Update the local alignment with the correct ID from the server
        setAlignments(prev => prev.map(a => 
          a.id === Date.now() ? {...a, id: response.data.id} : a
        ));
      })
      .catch(error => {
        console.error('Error saving alignment:', error);
        // Remove the temporary alignment on error
        setAlignments(prev => prev.filter(a => a.id !== Date.now()));
      });
    
    // Clear selections
    setSelectedSourceIndices([]);
    setSelectedTargetIndices([]);
  };

  // Remove an existing alignment
  const removeAlignment = (alignmentId) => {
    setAlignments(prev => prev.filter(a => a.id !== alignmentId));
    
    // Delete from backend
    apiClient.delete(`/alignments/${alignmentId}/`)
      .then(() => console.log('Alignment deleted'))
      .catch(error => console.error('Error deleting alignment:', error));
  };

  // Check if word is part of an alignment
  const getWordAlignments = (language, index) => {
    return alignments.filter(a => 
      language === 'source' 
        ? a.source_indices.includes(index)
        : a.target_indices.includes(index)
    );
  };

  // Get color for aligned words (unique color per alignment)
  const getColorForAlignment = (alignmentId) => {
    // Simple hash function to generate colors
    const colors = [
      '#FFD700', '#FF6347', '#4682B4', '#32CD32', 
      '#BA55D3', '#FF69B4', '#20B2AA', '#F08080'
    ];
    return colors[alignmentId % colors.length];
  };
  
  // Set up TanStack Table for alignments
  const columnHelper = createColumnHelper();
  
  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('source_indices', {
      header: 'Source Text',
      cell: info => {
        const indices = info.getValue();
        return indices.map(i => sourceText[i]).join(' ');
      },
    }),
    columnHelper.accessor('target_indices', {
      header: 'Target Text',
      cell: info => {
        const indices = info.getValue();
        return indices.map(i => targetText[i]).join(' ');
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button 
          onClick={() => removeAlignment(info.row.original.id)}
          className="delete-button"
        >
          Remove
        </button>
      ),
    }),
  ];
  
  const table = useReactTable({
    data: alignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="alignment-interface">
        <div className="sentence-selector">
        <label htmlFor="sentence-pair">Select Sentence Pair: </label>
        <select 
            id="sentence-pair"
            value={currentPairId}
            onChange={(e) => fetchSentencePair(parseInt(e.target.value))}
        >
            {sentencePairs.map(pair => (
            <option key={pair.id} value={pair.id}>
                {pair.source_language} → {pair.target_language}: {pair.source_sentence.substring(0, 30)}...
            </option>
            ))}
        </select>
        </div>
      <div className="text-containers">
        <div className="source-container">
          <h3>Source Text</h3>
          <div className="words-container">
            {sourceText.map((word, index) => {
              const wordAlignments = getWordAlignments('source', index);
              const isSelected = selectedSourceIndices.includes(index);
              
              return (
                <span 
                  key={`source-${index}`}
                  className={`word ${isSelected ? 'selected' : ''}`}
                  style={{
                    backgroundColor: wordAlignments.length > 0 
                      ? getColorForAlignment(wordAlignments[0].id) 
                      : isSelected ? '#e6f7ff' : 'transparent'
                  }}
                  onClick={() => toggleSourceWord(index)}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
        
        <div className="target-container">
          <h3>Target Text</h3>
          <div className="words-container">
            {targetText.map((word, index) => {
              const wordAlignments = getWordAlignments('target', index);
              const isSelected = selectedTargetIndices.includes(index);
              
              return (
                <span 
                  key={`target-${index}`}
                  className={`word ${isSelected ? 'selected' : ''}`}
                  style={{
                    backgroundColor: wordAlignments.length > 0 
                      ? getColorForAlignment(wordAlignments[0].id) 
                      : isSelected ? '#e6f7ff' : 'transparent'
                  }}
                  onClick={() => toggleTargetWord(index)}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="controls">
        <button 
          onClick={createAlignment}
          disabled={selectedSourceIndices.length === 0 || selectedTargetIndices.length === 0}
          className="primary-button"
        >
          Create Alignment
        </button>
        
        <button 
          onClick={() => {
            setSelectedSourceIndices([]);
            setSelectedTargetIndices([]);
          }}
          className="secondary-button"
        >
          Clear Selection
        </button>
      </div>
      
      <div className="alignments-table">
        <h3>Current Alignments</h3>
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                style={{ 
                  backgroundColor: getColorForAlignment(row.original.id),
                  color: row.original.id % 8 < 4 ? 'black' : 'white'
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlignmentInterface;
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    setResumes(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription || resumes.length === 0) {
      setError('Please provide a job description and at least one resume.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResults([]);

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    resumes.forEach(resume => {
      formData.append('resumes', resume);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err) {
      setError('An error occurred during analysis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score > 75) return 'text-green-400';
    if (score > 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">AI Resume Analyzer 🚀</h1>
          <p className="text-slate-400 mt-2">Rank candidates based on job description compatibility.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
          <div className="mb-6">
            <label htmlFor="jobDescription" className="block text-lg font-medium text-slate-300 mb-2">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              rows="8"
              className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-medium text-slate-300 mb-2">
              Upload Resumes (PDF only)
            </label>
            <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer text-center transition ${isDragActive ? 'border-cyan-500 bg-slate-700' : 'border-slate-600'}`}>
              <input {...getInputProps()} />
              {resumes.length > 0 ? (
                <p className="text-slate-300">{resumes.length} resume(s) selected.</p>
              ) : (
                <p className="text-slate-400">Drag & drop PDF files here, or click to select files</p>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-md text-white font-bold text-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : 'Analyze Resumes'}
          </button>
        </form>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center mb-8">{error}</div>}

        {results.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-6">Analysis Results</h2>
            <ul className="space-y-4">
              {results.map((result, index) => (
                <li key={result._id} className="bg-slate-700 p-4 rounded-md flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-cyan-400 mr-4">{index + 1}.</span>
                    <span className="text-slate-200">{result.name}</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
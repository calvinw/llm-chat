import React from 'react';
import ReactDOM from 'react-dom/client';
import LLMChatInterface from './LLMChatInterface.jsx';

const App = () => {
    return (
        <div className="overflow-hidden h-screen bg-gray-50">
            <LLMChatInterface />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
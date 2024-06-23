import React, { useState, useRef, useEffect } from "react";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import logo from "../src/assets/logo.png"
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
	
import ReactMarkdown from "react-markdown";


const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [assistantId, setAssistantId] = useState(null);
  const [pdfData, setPdfData] = useState({});
  const [pdfState, setPdfState] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const fetchPdfData = async () => {
      try {
        const response = await fetch("http://localhost:8000/pdf_data");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setPdfData(data);
        console.log("data:", data);
      } catch (error) {
        console.error("Error fetching PDF data:", error);
      }
    };

    fetchPdfData();
  }, [pdfState]);

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "" || isLoading) return;

    const newUserMessage = { text: inputValue, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsLoading(true);


    setMessages((prevMessages) => [...prevMessages]);

    try {
      const params = new URLSearchParams({
        input_: inputValue,
        assistant_id_: assistantId || "your_default_assistant_id_here",
      });

      const response = await fetch(`http://localhost:8000/ai?${params}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      let botResponse = data.ans;

      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isLoading),
        { text: botResponse, sender: "bot" },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isLoading),
        {
          text: "Sorry, there was an error processing your request.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please select a PDF file.");
      event.target.value = null;
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const response = await fetch("http://localhost:8000/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        setAssistantId(data.id);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: `PDF uploaded successfully: ${data.filename}`,
            sender: "user",
          },
        ]);
        setPdfState(true)
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Error uploading PDF: ${error.message}`, sender: "user" },
      ]);
    } finally {
      setIsLoading(false);
      setPdfFile(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  const handlePdfSelect = (pdfName) => {
    setSelectedPdf(pdfName);
    setAssistantId(pdfData[pdfName]);
    console.log("assAssistant", assistantId);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar */}
      <div className="Navbar h-16 shadow-md flex justify-between items-center px-8">
        <div>
          <img src={logo} alt="ai planet" />
        </div>
        {/* <div>{pdfFile ? pdfFile.name : "PDF"}</div> */}
        <div className="w-[20%] px-4 py-2  border-gray-200">
          <div className="flex flex-wrap gap-2">
            <FormControl fullWidth>
            {!selectedPdf && (
        <InputLabel id="pdf-select-label">Select uploaded PDF</InputLabel>
      )}              <Select
                labelId="pdf-select-label"
                id="pdf-select"
                value={selectedPdf}
                onChange={(event) => handlePdfSelect(event.target.value)}
              >
                {Object.keys(pdfData).map((pdfName) => (
                  <MenuItem key={pdfName} value={pdfName}>
                    {pdfName.replace("temp_", "")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <ReactMarkdown 
              // remarkPlugins={[remarkGfm]}
              className={`max-w-[70%] p-3 rounded-lg break-words ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              } ${message.isLoading ? "animate-pulse" : ""}`}
            >
              {typeof message.text === "string" ? message.text : message.text}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* PDF upload box */}
      {pdfFile && (
        <div className="w-full px-4 py-2 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{pdfFile.name}</span>
            <button
              onClick={uploadPdf}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              <CloudUploadIcon className="mr-2" />
              Upload PDF
            </button>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
            <div className="animate-pulse flex space-x-2">
              <div className="rounded-full bg-gray-400 h-3 w-3"></div>
              <div className="rounded-full bg-gray-400 h-3 w-3"></div>
              <div className="rounded-full bg-gray-400 h-3 w-3"></div>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="w-full shadow-inner px-4">
        <form
          onSubmit={handleSubmit}
          className="w-[93%] mx-auto bg-[#E4E8EE] rounded-md flex my-6 items-center"
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={triggerFileInput}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-slate-300 rounded-full transition-all delay-500ms"
          >
            <AttachFileIcon />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-10 flex-grow bg-transparent  outline-none placeholder:text-sm text-gray-800"
            placeholder="Send a message.."
            disabled={isLoading}
          />
          <button type="submit" className="px-2" disabled={isLoading}>
            <SendOutlinedIcon
              className={`${isLoading ? "text-gray-300" : "text-gray-400"}`}
            />
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

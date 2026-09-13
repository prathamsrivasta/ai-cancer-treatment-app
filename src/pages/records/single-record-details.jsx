import React, { useState } from "react";
import {
  IconChevronRight,
  IconFileUpload,
  IconProgress,
} from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStateContext } from "../../context/index";
import ReactMarkdown from "react-markdown";
import FileUploadModal from "./components/file-upload-modal";
import RecordDetailsHeader from "./components/record-details-header";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

function SingleRecordDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processing, setIsProcessing] = useState(false);

  const [analysisResult, setAnalysisResult] = useState(
    state.analysisResult || ""
  );

  const [filename, setFilename] = useState("");
  const [filetype, setFileType] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { updateRecord } = useStateContext();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileType(selectedFile.type);
    setFilename(selectedFile.name);
    setFile(selectedFile);
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // =========================
  // FILE UPLOAD + AI ANALYSIS
  // =========================
  const handleFileUpload = async () => {
    setUploading(true);
    setUploadSuccess(false);

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      const base64Data = await readFileAsBase64(file);

      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: filetype,
          },
        },
      ];

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const prompt = `
You are a professional medical report analyzer.

Analyze the uploaded medical report.

Provide:
- Key Findings
- Possible Diagnosis
- Recommended Treatment Plan
- Lifestyle Suggestions

Make the explanation clear and patient friendly.
`;

      const result = await model.generateContent([
        { text: prompt },
        ...imageParts,
      ]);

      const response = await result.response;
      const text = response.text();

      setAnalysisResult(text);

      await updateRecord({
        documentID: state.id,
        analysisResult: text,
        kanbanRecords: "",
      });

      setUploadSuccess(true);
      setIsModalOpen(false);
      setFilename("");
      setFile(null);
      setFileType("");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // CONVERT RESULT → KANBAN
  // =========================
  const processTreatmentPlan = async () => {
    setIsProcessing(true);

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const prompt = `
Convert this treatment plan into Kanban tasks.

Treatment Plan:
${analysisResult}

Return ONLY JSON:

{
 "columns":[
  {"id":"todo","title":"Todo"},
  {"id":"doing","title":"Work in progress"},
  {"id":"done","title":"Done"}
 ],
 "tasks":[
  {"id":"1","columnId":"todo","content":"Example task"}
 ]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean Gemini formatting
      text = text.replace(/```json|```/g, "").trim();

      const parsedResponse = JSON.parse(text);

      await updateRecord({
        documentID: state.id,
        kanbanRecords: text,
      });

      navigate("/screening-schedules", { state: parsedResponse });
    } catch (error) {
      console.error("JSON parse error:", error);
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-wrap gap-[26px]">
      <button
        onClick={handleOpenModal}
        className="mt-6 inline-flex items-center gap-x-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 dark:border-neutral-700 dark:bg-[#13131a] dark:text-white"
      >
        <IconFileUpload />
        Upload Reports
      </button>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFileChange={handleFileChange}
        onFileUpload={handleFileUpload}
        uploading={uploading}
        uploadSuccess={uploadSuccess}
        filename={filename}
      />

      <RecordDetailsHeader recordName={state.recordName} />

      <div className="w-full">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-[#13131a]">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Personalized AI-Driven Treatment Plan
            </h2>
          </div>

          <div className="px-6 py-4">
            <div className="prose max-w-none prose-gray dark:prose-invert">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>

            <div className="mt-6">
              <button
                onClick={processTreatmentPlan}
                disabled={processing}
                className="inline-flex items-center gap-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-neutral-900 dark:text-white"
              >
                View Treatment Plan
                <IconChevronRight size={20} />
                {processing && (
                  <IconProgress className="animate-spin ml-2" size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleRecordDetails;
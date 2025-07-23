// "use client";
// import { Button, Card, CardBody, CardHeader, Select, SelectItem } from '@heroui/react';
// import React from 'react';
// import { useRecording, useRecordingDomains, useAuth } from '../../hooks/useAPI';
// import { useRouter } from 'next/navigation';

// const RecordingPage = () => {
//   const { user, isAuthenticated } = useAuth();
//   const { domains, isLoading: domainsLoading } = useRecordingDomains();
//   const { 
//     currentRecording, 
//     isLoading, 
//     error, 
//     createRecording, 
//     startRecording, 
//     stopRecording, 
//     uploadAudio 
//   } = useRecording();
  
//   const [selectedDomain, setSelectedDomain] = React.useState('');
//   const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
//   const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
//   const [isRecording, setIsRecording] = React.useState(false);
//   const router = useRouter();

// //   // Redirect if not authenticated
// //   React.useEffect(() => {
// // 	console.log("RECORDING PAGE: isAuthenticated:", isAuthenticated);
// //     if (!isAuthenticated) {
// //       router.push('/auth/login');
// //     }
// //   }, [isAuthenticated, router]);

//   // Initialize recording
//   const handleCreateRecording = async () => {
//     if (!selectedDomain) return;
    
//     try {
//       await createRecording(selectedDomain);
//     } catch (err) {
//       console.error('Failed to create recording:', err);
//     }
//   };

//   // Start recording audio
//   const handleStartRecording = async () => {
//     if (!currentRecording) return;

//     try {
//       // Start recording session in backend
//       await startRecording(currentRecording.id);

//       // Start audio recording
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const recorder = new MediaRecorder(stream);
//       const chunks: BlobPart[] = [];

//       recorder.ondataavailable = (event) => {
//         chunks.push(event.data);
//       };

//       recorder.onstop = () => {
//         const blob = new Blob(chunks, { type: 'audio/wav' });
//         setAudioBlob(blob);
//         stream.getTracks().forEach(track => track.stop());
//       };

//       recorder.start();
//       setMediaRecorder(recorder);
//       setIsRecording(true);
//     } catch (err) {
//       console.error('Failed to start recording:', err);
//     }
//   };

//   // Stop recording
//   const handleStopRecording = async () => {
//     if (!currentRecording || !mediaRecorder) return;

//     try {
//       // Stop audio recording
//       mediaRecorder.stop();
//       setIsRecording(false);
//       setMediaRecorder(null);

//       // Stop recording session in backend
//       await stopRecording(currentRecording.id);
//     } catch (err) {
//       console.error('Failed to stop recording:', err);
//     }
//   };

//   // Upload recorded audio
//   const handleUploadAudio = async () => {
//     if (!currentRecording || !audioBlob) return;

//     try {
//       const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
//       await uploadAudio(currentRecording.id, audioFile);
//       setAudioBlob(null);
//     } catch (err) {
//       console.error('Failed to upload audio:', err);
//     }
//   };

//   const resetRecording = () => {
//     setAudioBlob(null);
//     setIsRecording(false);
//     setMediaRecorder(null);
//   };

//   if (!isAuthenticated) {
//     return <div>Redirecting to login...</div>;
//   }

//   return (
//     <div className='min-h-screen bg-gray-50 p-8'>
//       <div className='max-w-4xl mx-auto'>
//         <Card className='mb-6'>
//           <CardHeader>
//             <h1 className='text-2xl font-bold'>Speech Recording</h1>
//             <p className='text-gray-600'>Record your speech for analysis</p>
//           </CardHeader>
//           <CardBody className='space-y-6'>
//             {/* User Info */}
//             <div className='bg-blue-50 p-4 rounded-lg'>
//               <p className='text-sm text-blue-800'>
//                 Logged in as: <span className='font-semibold'>{user?.email}</span>
//               </p>
//             </div>

//             {/* Error Display */}
//             {error && (
//               <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
//                 <p className='text-red-700'>{error}</p>
//               </div>
//             )}

//             {/* Domain Selection */}
//             {!currentRecording && (
//               <div className='space-y-4'>
//                 <h3 className='text-lg font-semibold'>Select Recording Domain</h3>
//                 <Select
//                   placeholder='Choose a domain'
//                   selectedKeys={selectedDomain ? [selectedDomain] : []}
//                   onSelectionChange={(keys) => {
//                     const selected = Array.from(keys)[0] as string;
//                     setSelectedDomain(selected);
//                   }}
//                   isLoading={domainsLoading}
//                   disabled={domainsLoading || isLoading}
//                 >
//                   {domains.map((domain) => (
//                     <SelectItem key={domain.id}>
//                       {domain.label}
//                     </SelectItem>
//                   ))}
//                 </Select>
//                 <Button
//                   onClick={handleCreateRecording}
//                   isLoading={isLoading}
//                   disabled={!selectedDomain || isLoading}
//                   className='bg-blue-600 text-white'
//                 >
//                   Create Recording Session
//                 </Button>
//               </div>
//             )}

//             {/* Recording Controls */}
//             {currentRecording && (
//               <div className='space-y-4'>
//                 <div className='bg-green-50 p-4 rounded-lg'>
//                   <h3 className='text-lg font-semibold text-green-800'>Recording Session</h3>
//                   <p className='text-green-700'>
//                     ID: {currentRecording.id} | Status: {currentRecording.status}
//                   </p>
//                   {currentRecording.domain && (
//                     <p className='text-green-700'>Domain: {currentRecording.domain}</p>
//                   )}
//                 </div>

//                 {/* Recording State */}
//                 <div className='flex items-center gap-4'>
//                   {isRecording && (
//                     <div className='flex items-center gap-2'>
//                       <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
//                       <span className='text-red-600 font-semibold'>Recording...</span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Recording Buttons */}
//                 <div className='flex gap-4'>
//                   {!isRecording && !audioBlob && (
//                     <Button
//                       onClick={handleStartRecording}
//                       isLoading={isLoading}
//                       disabled={isLoading}
//                       className='bg-red-600 text-white'
//                     >
//                       Start Recording
//                     </Button>
//                   )}

//                   {isRecording && (
//                     <Button
//                       onClick={handleStopRecording}
//                       isLoading={isLoading}
//                       disabled={isLoading}
//                       className='bg-gray-600 text-white'
//                     >
//                       Stop Recording
//                     </Button>
//                   )}

//                   {audioBlob && !isRecording && (
//                     <div className='flex gap-4'>
//                       <Button
//                         onClick={handleUploadAudio}
//                         isLoading={isLoading}
//                         disabled={isLoading}
//                         className='bg-green-600 text-white'
//                       >
//                         Upload Recording
//                       </Button>
//                       <Button
//                         onClick={resetRecording}
//                         disabled={isLoading}
//                         variant='light'
//                       >
//                         Record Again
//                       </Button>
//                     </div>
//                   )}
//                 </div>

//                 {/* Audio Preview */}
//                 {audioBlob && (
//                   <div className='bg-gray-50 p-4 rounded-lg'>
//                     <h4 className='font-semibold mb-2'>Recorded Audio Preview</h4>
//                     <audio 
//                       controls 
//                       src={URL.createObjectURL(audioBlob)}
//                       className='w-full'
//                     />
//                   </div>
//                 )}

//                 {/* Upload Success */}
//                 {currentRecording.status === 'completed' && (
//                   <div className='bg-green-50 border border-green-200 p-4 rounded-lg'>
//                     <p className='text-green-700 font-semibold'>
//                       ✅ Recording uploaded successfully!
//                     </p>
//                     {currentRecording.audioFilePath && (
//                       <p className='text-green-600 text-sm'>
//                         File: {currentRecording.audioFilePath}
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}
//           </CardBody>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default RecordingPage;

import RecordingPage from '@/components/recoding-page'
import React from 'react'

const RecordPage = () => {
  return (
	<RecordingPage />
  )
}

export default RecordPage
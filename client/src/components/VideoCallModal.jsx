import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer/simplepeer.min.js';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const VideoCallModal = ({ isOpen, onClose, remoteUser, isIncoming, incomingSignal, callType = 'video' }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const streamRef = useRef();
    const mediaRequested = useRef(false);

    useEffect(() => {
        if (!isOpen) return;
        if (mediaRequested.current) return;
        mediaRequested.current = true;

        const getMedia = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({ 
                    video: callType === 'video' ? { width: 1280, height: 720 } : false, 
                    audio: true 
                });
                
                setStream(currentStream);
                streamRef.current = currentStream;
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }

                if (!isIncoming) {
                    startCall(currentStream);
                }
            } catch (err) {
                console.error('Media error:', err);
                if (err.name === 'NotReadableError') {
                    toast.error('Camera or microphone is already in use by another application');
                } else {
                    toast.error('Could not access camera/microphone');
                }
                onClose();
            }
        };

        getMedia();

        socket.on('callRejected', () => {
            toast.info('Call rejected');
            cleanup();
        });

        socket.on('callEnded', () => {
            toast.info('Call ended');
            cleanup();
        });

        return () => {
            socket.off('callRejected');
            socket.off('callEnded');
            mediaRequested.current = false;
            // Immediate cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isOpen]);

    const startCall = (currentStream) => {
        try {
            console.log('Peer constructor:', Peer);
            const peer = new Peer({ 
                initiator: true, 
                trickle: false, 
                stream: currentStream 
            });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: remoteUser._id,
                signalData: data,
                from: user._id,
                name: user.name,
                callType
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        socket.on('callAccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
        } catch (err) {
            console.error('Peer error:', err);
            toast.error('Failed to establish peer connection');
            cleanup();
        }
    };

    const answerCall = () => {
        setCallAccepted(true);
        const peer = new Peer({ 
            initiator: false, 
            trickle: false, 
            stream: stream 
        });

        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: remoteUser._id });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.signal(incomingSignal);
        connectionRef.current = peer;
    };

    const rejectCall = () => {
        socket.emit('rejectCall', { to: remoteUser._id });
        cleanup();
    };

    const endCall = () => {
        socket.emit('endCall', { to: remoteUser._id });
        cleanup();
    };

    const cleanup = () => {
        if (connectionRef.current) {
            try { connectionRef.current.destroy(); } catch (e) {}
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        setStream(null);
        onClose();
    };

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream && callType === 'video') {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
            <div className="relative bg-gray-950 w-full h-full md:max-w-5xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header Info (Mobile Friendly) */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                    <img src={remoteUser?.avatar} className="w-12 h-12 rounded-full border-2 border-white/20" alt="" />
                    <div className="text-white drop-shadow-lg">
                        <h2 className="font-bold text-lg">{remoteUser?.name}</h2>
                        <p className="text-sm opacity-80">{callAccepted ? 'Connected' : isIncoming ? 'Incoming Call...' : 'Calling...'}</p>
                    </div>
                </div>

                {/* Video Area */}
                <div className="flex-1 relative bg-black flex items-center justify-center">
                    {/* Remote Video (Full Screen) */}
                    {callAccepted ? (
                        <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-primary-600/20 animate-pulse rounded-full flex items-center justify-center mb-4 ring-4 ring-primary-500/30">
                                <Phone size={40} className="text-primary-500" />
                            </div>
                        </div>
                    )}

                    {/* Local Video (Floating) */}
                    {stream && (
                        <div className={`absolute bottom-24 right-4 md:bottom-6 md:right-6 w-32 md:w-56 aspect-[3/4] md:aspect-video bg-gray-900 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl transition-all duration-500 ${isVideoOff ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                            <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover mirror" />
                        </div>
                    )}
                </div>

                {/* Controls Area (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 md:pb-8 flex justify-center items-center gap-4 md:gap-8 bg-gradient-to-t from-black/80 to-transparent z-30">
                    <button 
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all transform active:scale-90 ${isMuted ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {callType === 'video' && (
                        <button 
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all transform active:scale-90 ${isVideoOff ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                    )}
                    
                    {isIncoming && !callAccepted ? (
                        <div className="flex gap-4">
                            <button 
                                onClick={rejectCall}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-500/30 transition-all transform active:scale-95"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={answerCall}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-lg shadow-green-500/30 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                <Phone size={20} />
                                Accept
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={endCall}
                            className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-xl shadow-red-500/40 transition-all transform hover:rotate-135 active:scale-90"
                        >
                            <PhoneOff size={28} />
                        </button>
                    )}
                </div>
            </div>

            <style>
                {`
                .mirror { transform: scaleX(-1); }
                .rotate-135 { transform: rotate(135deg); }
                `}
            </style>
        </div>
    );
};

export default VideoCallModal;

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Home, Sparkles, ListVideo, Settings, Key, AlertCircle, PlayCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from './lib/utils';
import imageCompression from 'browser-image-compression';

function ToastContainer() {
  const { toasts, removeToast } = useAppContext();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={cn(
            "px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center justify-between w-72 animate-in slide-in-from-top-2",
            toast.type === 'error' && "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
            toast.type === 'success' && "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
            toast.type === 'info' && "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
          )}
        >
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">×</button>
        </div>
      ))}
    </div>
  );
}

// --- API Service Wrapper ---
async function magnificApi(endpoint: string, apiKey: string, body?: any, method = 'POST', apiMode: 'direct' | 'proxy' = 'direct') {
  // apiMode 'direct' memicu fetch langsung ke Magnific API (menggunakan IP user)
  // apiMode 'proxy' memicu fetch melalui server route /api/magnific (menggunakan IP server)
  const targetUrl = apiMode === 'direct' 
    ? `https://api.magnific.com${endpoint}`
    : `/api/magnific${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiMode === 'direct') {
    headers['x-magnific-api-key'] = apiKey;
  } else {
    headers['x-user-api-key'] = apiKey;
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || (data.invalid_params ? JSON.stringify(data.invalid_params) : `${res.status} ${res.statusText} - API Request Failed`);
    throw new Error(errorMsg);
  }
  return data;
}

// --- Views ---

function SettingsView() {
  const { apiKey, setApiKey, isDarkMode, toggleDarkMode, apiMode, setApiMode, showToast } = useAppContext();
  const [inputVal, setInputVal] = useState(apiKey);

  const handleSave = () => {
    setApiKey(inputVal);
    showToast("API Key berhasil disimpan di localStorage perangkat Anda.", "success");
  };

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-lg mx-auto w-full">
      <div className="text-center space-y-2">
        <div className="mx-auto bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 p-4 rounded-full w-16 h-16 flex items-center justify-center">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ani Malar Studio</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Gunakan API Key Anda untuk akses penuh tanpa batas.</p>
      </div>

      <div className="glass-pink dark:glass-dark p-4 rounded-xl flex gap-3 text-pink-800 dark:text-pink-200 text-sm">
        <AlertCircle className="shrink-0" size={20} />
        <p>Aplikasi ini bersifat Stateless. Kunci API hanya tersimpan aman di browser Anda dan tidak dikirim ke server pihak ketiga manapun selain API endpoint utama.</p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">API Key</label>
        <input 
          type="password"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 glass dark:glass-dark border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition-shadow dark:text-white"
        />
        <button 
          onClick={handleSave}
          className="w-full bg-pink-500 text-white font-semibold py-3 rounded-xl hover:bg-pink-600 transition shadow-lg shadow-pink-200 dark:shadow-none"
        >
          Simpan Key
        </button>
      </div>

      <div className="flex items-center justify-between mt-6 p-4 glass dark:glass-dark rounded-xl shadow-sm">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Dark Mode</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pilih tema tampilan aplikasi</p>
        </div>
        <button 
          onClick={toggleDarkMode}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            isDarkMode ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isDarkMode ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>

      <div className="p-4 glass dark:glass-dark rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Koneksi Langsung (Anti-Block)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gunakan IP individual untuk menghindari pemblokiran server.</p>
          </div>
          <button 
            onClick={() => {
              const newMode = apiMode === 'direct' ? 'proxy' : 'direct';
              setApiMode(newMode);
              showToast(`Mode koneksi diubah ke ${newMode === 'direct' ? 'Langsung' : 'Proxy'}.`, "info");
            }}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              apiMode === 'direct' ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              apiMode === 'direct' ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-[10px] text-blue-800 dark:text-blue-200">
          <p className="font-bold mb-1">Status Mode:</p>
          {apiMode === 'direct' ? (
            <div className="space-y-1">
              <p>âœ… <b>Mode Langsung Aktif:</b> Permintaan dikirim langsung dari browser Anda ke Magnific. Ini solusi terbaik untuk error "Suspicious Activity" atau "Shared IP Limit".</p>
              <p className="opacity-70 italic">* Jika request gagal/CORS, gunakan browser extension "Allow CORS" atau matikan mode ini.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p>âš ï¸ <b>Mode Proxy Aktif:</b> Permintaan dikirim melalui server aplikasi. Jika banyak user menggunakan aplikasi ini sekaligus, Magnific mungkin memblokir IP server kami (Suspicious Activity).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateView() {
  const { apiKey, apiMode, addTask, showToast } = useAppContext();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Tools Configuration based on docs
  const tools = [
    { id: 'happy-horse', name: 'Happy Horse 1.0 (R2V)', desc: 'Gen video dari referensi karakter', endpoint: '/v1/ai/reference-to-video/happy-horse-1', type: 'gen', multipleImages: true, maxImages: 9, payloadField: 'image_urls', promptOptional: false,
      preparePayload: (payload: any, images: string[], videoUrl: string, audioUrl: string) => {
         if (images.length > 0) payload.image_urls = images.map(url => ({url}));
      },
      params: [
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1', '4:3', '3:4'], default: '16:9' },
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720P', '1080P'], default: '1080P' },
        { name: 'duration', label: 'Duration (s)', type: 'number', min: 3, max: 15, default: 5 },
        { name: 'watermark', label: 'Watermark', type: 'boolean', default: false },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, optional: true }
      ]
    },
    { id: 'happy-horse-batch', name: 'Happy Horse 1.0 Batch Mode', desc: 'Gen video 4 Batch Sekaligus', endpoint: '/v1/ai/reference-to-video/happy-horse-1', type: 'gen', isBatch: true, multipleImages: true, maxImages: 9, payloadField: 'image_urls', promptOptional: false,
      preparePayload: (payload: any, images: string[], videoUrl: string, audioUrl: string) => {
         if (images.length > 0) payload.image_urls = images.map(url => ({url}));
      },
      params: [
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1', '4:3', '3:4'], default: '16:9' },
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720P', '1080P'], default: '1080P' },
        { name: 'duration', label: 'Duration (s)', type: 'number', min: 3, max: 15, default: 5 },
        { name: 'watermark', label: 'Watermark', type: 'boolean', default: false },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, optional: true }
      ]
    },
    { id: 'grok-imagine-i2v', name: 'GROK IMAGINE Image to Video', desc: 'Gen video high-end dari gambar (Mendukung Start & End Frame)', endpoint: '/v1/ai/image-to-video/ltx-2-pro', type: 'gen', multipleImages: true, maxImages: 2, promptOptional: false,
      preparePayload: (payload: any, images: string[]) => {
         if (images.length > 0) payload.image_url = images[0];
         if (images.length > 1) payload.last_image_url = images[1];
      },
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['1080p', '1440p', '2160p'], default: '1080p' },
        { name: 'duration', label: 'Duration (s)', type: 'select', options: [6, 8, 10], default: 6 },
        { name: 'fps', label: 'FPS', type: 'select', options: [25, 50], default: 25 },
        { name: 'generate_audio', label: 'Generate Audio', type: 'boolean', default: true },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 4294967295, optional: true }
      ]
    },
    { id: 'wan-2-7-r2v', name: 'WAN 2.7 (R2V)', desc: 'Gen video referensi (Max 5 Image)', endpoint: '/v1/ai/reference-to-video/wan-2-7', type: 'gen', multipleImages: true, maxImages: 5, payloadField: 'image_urls', promptOptional: false,
      preparePayload: (payload: any, images: string[], videoUrl: string, audioUrl: string) => {
         if (images.length > 0) payload.image_urls = images.map(url => ({url}));
      },
      params: [
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1', '4:3', '3:4'], default: '16:9' },
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720P', '1080P'], default: '1080P' },
        { name: 'duration', label: 'Duration (s)', type: 'number', min: 2, max: 10, default: 5 },
        { name: 'negative_prompt', label: 'Negative Prompt', type: 'text', optional: true },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, optional: true }
      ]
    },
    { id: 'kling-v3-motion-pro', name: 'Kling 3 Pro Motion Control', desc: 'Transfer animasi/motion', endpoint: '/v1/ai/video/kling-v3-motion-control-pro', type: 'edit', requiresImage: true, requiresVideo: true, imageField: 'image_url', videoField: 'video_url', promptOptional: true,
      params: [
        { name: 'character_orientation', label: 'Orientation', type: 'select', options: ['video', 'image'], default: 'video' },
        { name: 'cfg_scale', label: 'CFG Scale', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5 }
      ]
    },
    { id: 'kling-v2-6-motion-pro', name: 'Kling 2.6 Pro Motion Control', desc: 'Transfer animasi/motion', endpoint: '/v1/ai/video/kling-v2-6-motion-control-pro', type: 'edit', requiresImage: true, requiresVideo: true, imageField: 'image_url', videoField: 'video_url', promptOptional: true,
      params: [
        { name: 'character_orientation', label: 'Orientation', type: 'select', options: ['video', 'image'], default: 'video' },
        { name: 'cfg_scale', label: 'CFG Scale', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5 }
      ]
    },
    { id: 'kling-v2-6-motion-std', name: 'Kling 2.6 Std Motion Control', desc: 'Transfer animasi/motion', endpoint: '/v1/ai/video/kling-v2-6-motion-control-std', type: 'edit', requiresImage: true, requiresVideo: true, imageField: 'image_url', videoField: 'video_url', promptOptional: true,
      params: [
        { name: 'character_orientation', label: 'Orientation', type: 'select', options: ['video', 'image'], default: 'video' },
        { name: 'cfg_scale', label: 'CFG Scale', type: 'number', min: 0, max: 1, step: 0.1, default: 0.5 }
      ]
    },
    { id: 'happy-horse-video-edit', name: 'Happy Horse 1.0 Video Edit', desc: 'Edit video (opsional pakai Max 5 Image ref)', endpoint: '/v1/ai/video-edit/happy-horse-1', type: 'edit', requiresVideo: true, videoField: 'video_url', multipleImages: true, maxImages: 5, payloadField: 'image_urls', promptOptional: false,
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720P', '1080P'], default: '1080P' },
        { name: 'audio_setting', label: 'Audio Setting', type: 'select', options: ['auto', 'origin'], default: 'auto' },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, optional: true }
      ]
    },
    { id: 'runway-act-two', name: 'RunWay Act Two', desc: 'Sintesis ekspresi & postur', endpoint: '/v1/ai/video/runway-act-two', type: 'edit', requiresImage: true, requiresVideo: true, promptOptional: true, hidePrompt: true,
      preparePayload: (payload: any, images: string[], videoUrl: string) => {
         payload.character = { type: 'image', uri: images[0] };
         payload.reference = { type: 'video', uri: videoUrl };
         delete payload.prompt;
      },
      params: [
        { name: 'ratio', label: 'Aspect Ratio', type: 'select', options: ['1280:720', '720:1280', '1104:832', '832:1104', '960:960', '1584:672'], default: '1280:720' },
        { name: 'body_control', label: 'Body Control', type: 'boolean', default: true },
        { name: 'expression_intensity', label: 'Expression Intensity', type: 'number', min: 1, max: 5, default: 3 },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 4294967295, optional: true }
      ]
    },
    { id: 'veed-fabric-1-0-fast', name: 'Veed Fabric 1.0 Fast', desc: 'Lip sync dari audio', endpoint: '/v1/ai/lip-sync/veed-fabric-1-0-fast', type: 'lipsync', requiresImage: true, requiresAudio: true, imageField: 'image_url', audioField: 'audio_url', promptOptional: true, hidePrompt: true,
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720p', '480p'], default: '720p' }
      ]
    }
  ];

  if (activeTool) {
    const defaultTool = tools.find(t => t.id === activeTool)!;
    if (defaultTool.isBatch) {
      return <BatchGenerateForm tool={defaultTool} onBack={() => setActiveTool(null)} />;
    }
    return <GenerateForm tool={defaultTool} onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 px-2">Ani Malar Studio</h2>
      
      {['gen', 'edit', 'lipsync'].map(category => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-bold text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-3 px-2">
            {category === 'gen' ? '🚀 Generate' : category === 'edit' ? '✂️ Fine Tune' : '👄 Audio Sync'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {tools.filter(t => t.type === category).map(tool => (
              <button 
                key={tool.id} 
                onClick={() => setActiveTool(tool.id)}
                className="glass dark:glass-dark p-5 rounded-3xl shadow-sm flex flex-col items-start hover:shadow-lg hover:shadow-pink-100 dark:hover:shadow-none transition-all text-left space-y-3 group"
              >
                <div className="bg-pink-50 dark:bg-pink-900/30 p-3 rounded-2xl text-pink-500 dark:text-pink-400 group-hover:bg-pink-500 group-hover:text-white dark:group-hover:text-white transition-colors shadow-sm">
                  {category === 'gen' ? <PlayCircle size={26} /> : category === 'edit' ? <Sparkles size={26} /> : <ImageIcon size={26} />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{tool.name}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 font-medium">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GenerateForm({ tool, onBack }: { tool: any, onBack: () => void }) {
  const { apiKey, apiMode, addTask, showToast } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlStr, setImageUrlStr] = useState('');
  const [videoBase64, setVideoBase64] = useState<string>('');
  const [videoUrlStr, setVideoUrlStr] = useState('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [audioUrlStr, setAudioUrlStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  
  const [params, setParams] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (tool.params) {
      tool.params.forEach((p: any) => {
        initial[p.name] = p.default;
      });
    }
    return initial;
  });

  const handleImprovePrompt = async () => {
    if (!prompt) return;
    setImproving(true);
    try {
      const res = await magnificApi('/v1/ai/improve-prompt', apiKey, { prompt, type: 'video' }, 'POST', apiMode);
      if (res.data?.task_id) {
        let pending = true;
        let attempts = 0;
        let taskId = res.data.task_id;
        while(pending && attempts < 20) {
           await new Promise(r => setTimeout(r, 2000));
           const statusRes = await magnificApi(`/v1/ai/improve-prompt/${taskId}`, apiKey, undefined, 'GET', apiMode);
           if (statusRes.data?.status === 'COMPLETED') {
             if (statusRes.data.generated?.length) {
               setPrompt(statusRes.data.generated[0]);
             }
             pending = false;
           } else if (statusRes.data?.status === 'FAILED') {
             showToast('Gagal meningkatkan prompt', 'error');
             pending = false;
           }
           attempts++;
        }
      }
    } catch (e: any) {
      showToast(e.message || "Gagal meningkatkan prompt", 'error');
    } finally {
      setImproving(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const uploadToCloudinary = async (file: File | Blob) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'magnify');
    const res = await fetch('https://api.cloudinary.com/v1_1/dv4ar152y/auto/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload gagal');
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex?: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    const useCloudinary = tool.id.includes('kling');
    showToast(`Sedang memproses gambar...`, "info");
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      const newImages = await Promise.all(files.map(async (file: File) => {
        const compressedFile = await imageCompression(file, options);
        if (useCloudinary) {
          return await uploadToCloudinary(compressedFile);
        } else {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onload = () => resolve(reader.result as string);
          });
        }
      }));

      if (targetIndex !== undefined) {
        setImages(prev => {
          const next = [...prev];
          next[targetIndex] = newImages[0];
          return next;
        });
      } else if (tool.multipleImages) {
        setImages(prev => [...prev, ...newImages].slice(0, tool.maxImages || 9));
      } else {
        if (useCloudinary) {
          setImageUrlStr(newImages[0]);
          setImages([newImages[0]]); // Update both to keep form unified
        } else {
          setImages([newImages[0]]);
          setImageUrlStr('');
        }
      }
      showToast("Gambar berhasil diproses", "success");
    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Gagal memproses gambar", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const useCloudinary = tool.id.includes('kling');
    showToast(`Sedang memproses video...`, "info");
    try {
      if (useCloudinary) {
        const url = await uploadToCloudinary(file);
        setVideoUrlStr(url);
        setVideoBase64('');
      } else {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            setVideoBase64(reader.result as string);
            setVideoUrlStr('');
            resolve(true);
          };
        });
      }
      showToast("Video berhasil diproses", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memproses video", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const useCloudinary = tool.id.includes('kling');
    showToast(`Sedang memproses audio...`, "info");
    try {
      if (useCloudinary) {
        const url = await uploadToCloudinary(file);
        setAudioUrlStr(url);
        setAudioBase64('');
      } else {
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            setAudioBase64(reader.result as string);
            setAudioUrlStr('');
            resolve(true);
          };
        });
      }
      showToast("Audio berhasil diproses", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memproses audio", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey) {
      showToast("API Key diperlukan untuk mulai generate. Silahkan atur di menu Access.", "error");
      return;
    }

    if (!prompt && images.length === 0 && !imageUrlStr && !videoBase64 && !videoUrlStr && !audioBase64 && !audioUrlStr) {
      showToast("Harap isi input yang diperlukan.", "info");
      return;
    }

    setLoading(true);
    try {
      let payload: any = { ...params };
      if (!tool.promptOptional || prompt) payload.prompt = prompt;
      
      const finalImages = imageUrlStr ? [imageUrlStr] : images;
      const finalVideo = videoUrlStr || videoBase64;
      const finalAudio = audioUrlStr || audioBase64;

      if (tool.preparePayload) {
        tool.preparePayload(payload, finalImages, finalVideo, finalAudio);
      } else {
        if (tool.multipleImages && finalImages.length > 0) {
          payload[tool.payloadField || 'image_urls'] = finalImages;
        } else if (tool.requiresImage && finalImages.length > 0) {
          payload[tool.imageField || tool.payloadField || 'image_url'] = finalImages[0];
        }

        if (tool.requiresVideo && finalVideo) {
          payload[tool.videoField || 'video_url'] = finalVideo;
        }

        if (tool.requiresAudio && finalAudio) {
          payload[tool.audioField || 'audio_url'] = finalAudio;
        }
      }

      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      const res = await magnificApi(tool.endpoint, apiKey, payload, 'POST', apiMode);
      
      const taskId = res.data?.task_id || res.task_id || res.id;
      if (taskId) {
        addTask({ id: taskId, type: tool.name, getEndpoint: tool.endpoint });
        showToast("Task berhasil dibuat! Cek di menu Tasks.", "success");
        onBack();
      } else {
        showToast("Gagal membuat task, respon tidak valid", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Gagal menghubungi server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-6">
      <button onClick={onBack} className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 text-sm font-bold flex items-center gap-1 transition-colors">
        &larr; Beranda
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{tool.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tool.desc}</p>
      </div>

      {(tool.requiresImage || tool.multipleImages) && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Referensi Gambar {tool.multipleImages && `(Maks ${tool.maxImages || 9})`}
          </label>
          
          {tool.id === 'grok-imagine-i2v' ? (
            <div className="grid grid-cols-2 gap-4">
              {/* First Frame Card */}
              <div className="glass dark:glass-dark rounded-3xl p-4 text-center hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] border-none group">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 0)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                {images[0] ? (
                  <img src={images[0]} alt="First Frame" className="w-full h-full object-cover rounded-2xl absolute inset-0" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-pink-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">First Frame</span>
                  </div>
                )}
              </div>
              {/* Last Frame Card */}
              <div className="glass dark:glass-dark rounded-3xl p-4 text-center hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] border-none group">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 1)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                {images[1] ? (
                  <img src={images[1]} alt="Last Frame" className="w-full h-full object-cover rounded-2xl absolute inset-0" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-pink-400 opacity-60 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Last Frame</span>
                    <span className="text-[8px] font-bold text-gray-400">(Optional)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass dark:glass-dark rounded-3xl p-8 text-center hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden group">
              <input type="file" accept="image/*" multiple={tool.multipleImages} onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 group/img">
                      <img src={img} alt={`Preview ${idx+1}`} className="w-full h-full object-cover rounded-2xl shadow-sm border border-white/50" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-pink-400/60 dark:text-pink-400/40">
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl">
                    <ImageIcon size={32} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1">Upload Gambar</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest my-1">Atau Gunakan Link</div>
          <input 
            type="text" 
            placeholder="https://... (URL Gambar)" 
            value={imageUrlStr}
            onChange={(e) => setImageUrlStr(e.target.value)}
            className="w-full px-4 py-3 glass dark:glass-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm dark:text-white border-none shadow-sm"
          />
        </div>
      )}

      {tool.requiresVideo && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Referensi Video</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/80 transition cursor-pointer relative overflow-hidden group">
            <input type="file" accept="video/mp4,video/quicktime" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {videoBase64 ? (
              <div className="text-sm text-green-600 font-medium">Video siap diunggah</div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <PlayCircle size={32} />
                <span className="text-sm font-medium">Ketuk untuk upload video MP4/MOV (Base64)</span>
              </div>
            )}
          </div>
          <div className="text-center text-xs text-gray-400 font-medium my-1">ATAU</div>
          <input 
            type="text" 
            placeholder="https://... (URL Video Publik)" 
            value={videoUrlStr}
            onChange={(e) => setVideoUrlStr(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
          />
          {tool.id.includes('kling') && <p className="text-xs text-orange-500 font-medium">Model Kling wajib menggunakan URL Publik.</p>}
        </div>
      )}

      {tool.requiresAudio && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Referensi Audio</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/80 transition cursor-pointer relative overflow-hidden group">
            <input type="file" accept="audio/mp3,audio/wav,audio/x-m4a" onChange={handleAudioUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {audioBase64 ? (
              <div className="text-sm text-green-600 font-medium">Audio siap diunggah</div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="text-3xl">🎵</span>
                <span className="text-sm font-medium">Ketuk untuk upload audio (Base64)</span>
              </div>
            )}
          </div>
          <div className="text-center text-xs text-gray-400 font-medium my-1">ATAU</div>
          <input 
            type="text" 
            placeholder="https://... (URL Audio Publik)" 
            value={audioUrlStr}
            onChange={(e) => setAudioUrlStr(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
          />
        </div>
      )}

      {tool.params && tool.params.length > 0 && (
        <div className="space-y-4 glass dark:glass-dark p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Settings size={18} className="text-pink-500" /> Pengaturan
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {tool.params.map((p: any) => (
              <div key={p.name} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{p.label}</label>
                {p.type === 'select' ? (
                  <select 
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value})}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    {p.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : p.type === 'boolean' ? (
                  <button 
                    onClick={() => setParams({...params, [p.name]: !params[p.name]})}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      params[p.name] ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      params[p.name] ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                ) : p.type === 'text' ? (
                  <input 
                    type="text"
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value})}
                    placeholder={p.optional ? "Opsional" : ""}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                ) : p.type === 'number' ? (
                  <input 
                    type="number"
                    min={p.min} max={p.max} step={p.step}
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value !== '' ? Number(e.target.value) : undefined})}
                    placeholder={p.optional ? "Opsional" : ""}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {!tool.hidePrompt && (
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Intruksi Kreatif</label>
            <button onClick={handleImprovePrompt} disabled={improving} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all uppercase tracking-widest">
              {improving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Improve
            </button>
          </div>
          <textarea 
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Jelaskan secara detail apa yang Anda inginkan..."
            className="w-full px-5 py-4 glass dark:glass-dark rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none dark:text-white text-sm shadow-sm border-none transition-shadow"
          />
        </div>
      )}

      <button disabled={loading || isUploading} onClick={handleSubmit} className="w-full bg-pink-500 text-white font-bold py-5 rounded-3xl hover:bg-pink-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-pink-200 dark:shadow-none hover:scale-[1.02] active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        Generate
      </button>
    </div>
  );
}

interface BatchFormState {
  prompt: string;
  images: string[];
  imageUrlStr: string;
  videoBase64: string;
  videoUrlStr: string;
  audioBase64: string;
  audioUrlStr: string;
  params: Record<string, any>;
}

function BatchGenerateForm({ tool, onBack }: { tool: any, onBack: () => void }) {
  const { apiKey, apiMode, addTask, showToast } = useAppContext();
  
  const defaultParams = React.useMemo(() => {
    const initial: Record<string, any> = {};
    if (tool.params) {
      tool.params.forEach((p: any) => {
        initial[p.name] = p.default;
      });
    }
    return initial;
  }, [tool.params]);

  const [batches, setBatches] = useState<BatchFormState[]>(() => {
    return Array.from({ length: 4 }).map(() => ({
      prompt: '',
      images: [],
      imageUrlStr: '',
      videoBase64: '',
      videoUrlStr: '',
      audioBase64: '',
      audioUrlStr: '',
      params: { ...defaultParams }
    }));
  });
  
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [improving, setImproving] = useState(false);

  const currentBatch = batches[activeBatchIndex];
  
  const updateCurrentBatch = (updates: Partial<BatchFormState>) => {
    setBatches(prev => {
      const next = [...prev];
      next[activeBatchIndex] = { ...next[activeBatchIndex], ...updates };
      return next;
    });
  };

  const uploadToCloudinary = async (file: File | Blob) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'magnify');
    const res = await fetch('https://api.cloudinary.com/v1_1/dv4ar152y/auto/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload gagal');
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    const useCloudinary = tool.id.includes('kling');
    showToast(`Sedang memproses gambar...`, "info");
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      const newImages = await Promise.all(files.map(async (file: File) => {
        const compressedFile = await imageCompression(file, options);
        if (useCloudinary) {
          return await uploadToCloudinary(compressedFile);
        } else {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onload = () => resolve(reader.result as string);
          });
        }
      }));

      if (tool.multipleImages) {
        updateCurrentBatch({ images: [...currentBatch.images, ...newImages].slice(0, tool.maxImages || 9) });
      } else {
        if (useCloudinary) {
          updateCurrentBatch({ imageUrlStr: newImages[0], images: [newImages[0]] });
        } else {
          updateCurrentBatch({ images: [newImages[0]], imageUrlStr: '' });
        }
      }
      showToast("Gambar berhasil diproses", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memproses gambar", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!currentBatch.prompt) return;
    setImproving(true);
    try {
      const res = await magnificApi('/v1/ai/improve-prompt', apiKey, { prompt: currentBatch.prompt, type: 'video' }, 'POST', apiMode);
      if (res.data?.task_id) {
        let pending = true;
        let attempts = 0;
        let taskId = res.data.task_id;
        while(pending && attempts < 20) {
           await new Promise(r => setTimeout(r, 2000));
           const statusRes = await magnificApi(`/v1/ai/improve-prompt/${taskId}`, apiKey, undefined, 'GET', apiMode);
           if (statusRes.data?.status === 'COMPLETED') {
             if (statusRes.data.generated?.length) {
               updateCurrentBatch({ prompt: statusRes.data.generated[0] });
             }
             pending = false;
           } else if (statusRes.data?.status === 'FAILED') {
             showToast('Gagal meningkatkan prompt', 'error');
             pending = false;
           }
           attempts++;
        }
      }
    } catch (e: any) {
      showToast(e.message || "Gagal meningkatkan prompt", 'error');
    } finally {
      setImproving(false);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey) {
      showToast("API Key diperlukan untuk mulai generate. Silahkan atur di menu Access.", "error");
      return;
    }

    const activeBatchesToSubmit = batches.filter(batch => {
      // Validate if we have entered minimum info, e.g. prompt or image
      return batch.prompt || batch.images.length > 0 || batch.imageUrlStr;
    });

    if (activeBatchesToSubmit.length === 0) {
      showToast("Harap isi minimal 1 batch yang diperlukan.", "info");
      return;
    }

    setLoading(true);
    let successCount = 0;
    
    // We send sequence of requests
    for (const batch of activeBatchesToSubmit) {
      try {
        let payload: any = { ...batch.params };
        if (!tool.promptOptional || batch.prompt) payload.prompt = batch.prompt;
        
        const finalImages = batch.imageUrlStr ? [batch.imageUrlStr] : batch.images;

        if (tool.preparePayload) {
          tool.preparePayload(payload, finalImages, '', '');
        } else {
          if (tool.multipleImages && finalImages.length > 0) {
            payload[tool.payloadField || 'image_urls'] = finalImages;
          } else if (tool.requiresImage && finalImages.length > 0) {
            payload[tool.imageField || tool.payloadField || 'image_url'] = finalImages[0];
          }
        }

        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
            delete payload[key];
          }
        });

        const res = await magnificApi(tool.endpoint, apiKey, payload, 'POST', apiMode);
        const taskId = res.data?.task_id || res.task_id || res.id;
        if (taskId) {
          addTask({ id: taskId, type: tool.name, getEndpoint: tool.endpoint });
          successCount++;
        }
      } catch (e: any) {
        showToast(e.message || "Gagal menghubungi server untuk satu task", "error");
      }
    }
    
    setLoading(false);
    if (successCount > 0) {
      showToast(`${successCount} Task berhasil dibuat! Cek di menu Tasks.`, "success");
      onBack();
    }
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-6">
      <button onClick={onBack} className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 text-sm font-bold flex items-center gap-1 transition-colors">
        &larr; Beranda
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{tool.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tool.desc}</p>
      </div>

      <div className="flex gap-2 mb-4 p-1 glass dark:glass-dark rounded-2xl overflow-x-auto pb-2 scrollbar-hide">
        {batches.map((b, idx) => {
          const hasContent = b.prompt || b.images.length > 0 || b.imageUrlStr;
          return (
            <button
              key={idx}
              onClick={() => setActiveBatchIndex(idx)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
                activeBatchIndex === idx
                  ? "bg-pink-500 text-white shadow-md shadow-pink-100 dark:shadow-none"
                  : "text-gray-400 hover:text-pink-400 dark:hover:text-pink-300"
              )}
            >
              Batch {idx + 1}
              {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_8px_rgba(255,100,100,0.8)]"></span>}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 glass dark:glass-dark p-6 rounded-3xl shadow-sm">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
           <ImageIcon size={20} className="text-pink-500" /> Editor Batch {activeBatchIndex + 1}
        </h3>
        
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Referensi Gambar {tool.multipleImages && `(Maks ${tool.maxImages || 9})`}
          </label>
          <div className="glass dark:glass-dark rounded-3xl p-8 text-center hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden group">
            <input type="file" accept="image/*" multiple={tool.multipleImages} onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {currentBatch.images.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {currentBatch.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Preview ${idx+1}`} className="w-20 h-20 object-cover rounded-2xl border border-white/50 shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-pink-300 dark:text-pink-400/40">
                <ImageIcon size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest">Klik Upload</span>
              </div>
            )}
          </div>
          <div className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">Or URL</div>
          <input 
            type="text" 
            placeholder="https://... (URL Gambar)" 
            value={currentBatch.imageUrlStr}
            onChange={(e) => updateCurrentBatch({ imageUrlStr: e.target.value })}
            className="w-full px-4 py-3 glass dark:glass-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm dark:text-white border-none"
          />
        </div>

        {tool.params && tool.params.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/20 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Config Batch {activeBatchIndex + 1}</h3>
            <div className="grid grid-cols-1 gap-4">
              {tool.params.map((p: any) => (
                <div key={p.name} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{p.label}</label>
                  {p.type === 'select' ? (
                    <select 
                      value={currentBatch.params[p.name] ?? ''}
                      onChange={e => updateCurrentBatch({ params: { ...currentBatch.params, [p.name]: e.target.value } })}
                      className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                      {p.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : p.type === 'boolean' ? (
                    <button 
                      onClick={() => updateCurrentBatch({ params: { ...currentBatch.params, [p.name]: !currentBatch.params[p.name] } })}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        currentBatch.params[p.name] ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-700"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        currentBatch.params[p.name] ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  ) : p.type === 'text' ? (
                    <input 
                      type="text"
                      value={currentBatch.params[p.name] ?? ''}
                      onChange={e => updateCurrentBatch({ params: { ...currentBatch.params, [p.name]: e.target.value } })}
                      placeholder={p.optional ? "Opsional" : ""}
                      className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  ) : p.type === 'number' ? (
                    <input 
                      type="number"
                      min={p.min} max={p.max} step={p.step}
                      value={currentBatch.params[p.name] ?? ''}
                      onChange={e => updateCurrentBatch({ params: { ...currentBatch.params, [p.name]: e.target.value !== '' ? Number(e.target.value) : undefined } })}
                      placeholder={p.optional ? "Opsional" : ""}
                      className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {!tool.hidePrompt && (
          <div className="space-y-3 pt-6 border-t border-white/20 dark:border-white/5">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intruksi Batch</label>
              <button onClick={handleImprovePrompt} disabled={improving} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all uppercase tracking-widest">
                {improving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Improve
              </button>
            </div>
            <textarea 
              rows={3}
              value={currentBatch.prompt}
              onChange={(e) => updateCurrentBatch({ prompt: e.target.value })}
              placeholder="Detail instruksi..."
              className="w-full px-4 py-3 glass dark:glass-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none dark:text-white text-sm border-none shadow-sm"
            />
          </div>
        )}
      </div>

      <button disabled={loading || isUploading} onClick={handleSubmit} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl hover:bg-pink-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-pink-200 dark:shadow-none uppercase tracking-widest">
        {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        Generate All Batches
      </button>
    </div>
  );
}

function TaskView() {
  const { tasks, updateTaskStatus, apiKey, apiMode, clearTasks } = useAppContext();

  // Exponential Backoff Polling
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;
    
    // Check pending tasks
    const checkTasks = async () => {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      if (pendingTasks.length === 0) return;

      for (const task of pendingTasks) {
        try {
          if (!task.getEndpoint) {
            updateTaskStatus(task.id, 'failed');
            continue;
          }

          const getUrl = `${task.getEndpoint}/${task.id}`;
          const res = await magnificApi(getUrl, apiKey, undefined, 'GET', apiMode).catch(e => {
            console.error(`Task poll error for ${task.id}:`, e.message);
            if (e.message && (e.message.toLowerCase().includes('not found') || e.message.includes('404'))) {
              updateTaskStatus(task.id, 'failed');
            }
            return null;
          });
          
          if (!res) continue; // Request failed, skip and try again later
          
          const status = res.data?.status || res.status;
          
          if (status === 'COMPLETED' || status === 'completed' || status === 'success') {
            const resultUrl = res.data?.generated?.[0] || res.data?.url || res.data?.video_url || res.generated?.[0] || res.url || res.video_url || res.data?.video_path;
            updateTaskStatus(task.id, 'completed', resultUrl);
          } else if (status === 'FAILED' || status === 'failed' || res.error) {
            updateTaskStatus(task.id, 'failed');
          }
        } catch (e) {
          console.error(`Task check failed for ${task.id}`, e);
        }
      }
      
      if (isActive) {
        timeoutId = setTimeout(checkTasks, 5000);
      }
    };

    checkTasks();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [tasks, apiKey, updateTaskStatus]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 pt-24">
        <ListVideo size={48} className="text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Belum ada history. Mulai generate video Anda!</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Riwayat Task</h2>
        <button 
          onClick={() => {
            if (window.confirm('Hapus semua riwayat task?')) {
              clearTasks();
            }
          }}
          className="text-[10px] text-red-500 hover:text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors"
        >
          Bersihkan
        </button>
      </div>
      <div className="space-y-4">
        {tasks.map(t => (
          <div key={t.id} className="glass dark:glass-dark p-5 rounded-3xl shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex justify-between items-center">
              <span className="font-black text-gray-900 dark:text-gray-100 text-[10px] uppercase tracking-widest px-3 py-1 bg-pink-50 dark:bg-pink-900/20 rounded-full text-pink-600 dark:text-pink-400">{t.type}</span>
              <span className={cn(
                "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest",
                t.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                t.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              )}>
                {t.status}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium tracking-tight">ID: {t.id}</div>
              <div className="text-[10px] text-gray-400 font-medium tracking-tight">Created: {new Date(t.createdAt).toLocaleString()}</div>
            </div>
            
            {t.status === 'pending' && (
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-pink-400 h-full w-1/2 animate-[progress_2s_ease-in-out_infinite] rounded-full" />
              </div>
            )}

            {t.status === 'completed' && t.resultUrl && (
              <a href={t.resultUrl} target="_blank" rel="noreferrer" className="mt-2 text-center text-xs bg-pink-500 text-white font-bold py-3 rounded-2xl hover:bg-pink-600 transition-all shadow-lg shadow-pink-100 dark:shadow-none uppercase tracking-widest">
                Unduh Hasil
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Shell ---

function AppContent() {
  const [tab, setTab] = useState<'create' | 'tasks' | 'settings'>('create');

  return (
    <div className="min-h-screen bg-brand-pink dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-pink-200 dark:selection:bg-pink-900 transition-colors">
      <ToastContainer />
      <div className="pb-24 pt-4">
        {tab === 'settings' && <SettingsView />}
        {tab === 'create' && <CreateView />}
        {tab === 'tasks' && <TaskView />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass dark:glass-dark rounded-[2.5rem] safe-area-bottom z-50 transition-all shadow-2xl shadow-pink-200/50 dark:shadow-none border border-white/50">
        <div className="flex justify-between px-8 py-3">
          <button 
            onClick={() => setTab('create')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'create' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <Sparkles size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Studio</span>
          </button>
          
          <button 
            onClick={() => setTab('tasks')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'tasks' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <ListVideo size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Queue</span>
          </button>
          
          <button 
            onClick={() => setTab('settings')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'settings' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <Settings size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}


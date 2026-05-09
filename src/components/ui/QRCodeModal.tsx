import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { GlowButton } from './GlowButton';
import { Download, Copy, Share2, Palette, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
}

export function QRCodeModal({ isOpen, onClose, shortCode }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fgColor, setFgColor] = useState('#a855f7'); // Roxo padrão
  const [bgColor] = useState('#ffffff');
  const fullUrl = `${window.location.origin}/r/${shortCode}`;

  const downloadQRCode = () => {
    const canvas = document.querySelector(`#qr-canvas-${shortCode}`) as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${shortCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR Code baixado com sucesso!");
  };

  const copyImageToClipboard = async () => {
    try {
      const canvas = document.querySelector(`#qr-canvas-${shortCode}`) as HTMLCanvasElement;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          toast.success("QR Code copiado para a área de transferência!");
        } catch (clipErr) {
          console.error(clipErr);
          toast.error("Seu navegador não suporta cópia de imagens.");
        }
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao copiar imagem.");
    }
  };

  const colors = [
    { name: 'Roxo Senai', value: '#a855f7' },
    { name: 'Azul Tech', value: '#3b82f6' },
    { name: 'Esmeralda', value: '#10b981' },
    { name: 'Rosa Neon', value: '#f472b6' },
    { name: 'Branco Clássico', value: '#ffffff' },
    { name: 'Preto Profundo', value: '#000000' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code Premium">
      <div className="flex flex-col items-center gap-8 py-4">
        {/* QR Code Container */}
        <div 
          ref={canvasRef}
          className="p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-purple-500/20 border-4 border-white/10"
        >
          <QRCodeCanvas
            id={`qr-canvas-${shortCode}`}
            value={fullUrl}
            size={240}
            level="H"
            includeMargin={false}
            fgColor={fgColor}
            bgColor={bgColor}
          />
        </div>

        {/* Link Info */}
        <div className="text-center w-full">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Link de Destino</p>
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
             <p className="text-white text-sm font-mono truncate">{fullUrl}</p>
          </div>
        </div>

        {/* Customization Options */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            Personalizar Cor
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setFgColor(color.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-lg ${
                  fgColor === color.value ? 'border-white scale-110 shadow-white/20' : 'border-transparent opacity-60'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {fgColor === color.value && <Check className="w-4 h-4 mx-auto text-white mix-blend-difference" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full pt-4">
          <GlowButton onClick={downloadQRCode} className="w-full py-4 text-sm font-bold">
            <Download className="w-4 h-4 mr-2" />
            PNG
          </GlowButton>
          <GlowButton variant="secondary" onClick={copyImageToClipboard} className="w-full py-4 text-sm font-bold bg-white/5 border-white/10">
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </GlowButton>
        </div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText(fullUrl);
            toast.success("URL copiada!");
          }}
          className="text-white/30 hover:text-white/60 text-xs flex items-center gap-2 transition-colors py-2"
        >
          <Share2 className="w-3 h-3" />
          Ou clique para copiar a URL curta
        </button>
      </div>
    </Modal>
  );
}

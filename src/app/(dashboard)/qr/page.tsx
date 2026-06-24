'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/qr.css';

export default function QRCodeGenerator() {
  const { user } = useAuth();

  const [qrName, setQrName] = useState('My Menu QR');
  const [qrUrl, setQrUrl] = useState('');
  const [colorFg, setColorFg] = useState('#5d7a5d');
  const [colorBg, setColorBg] = useState('#ffffff');
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const defaultUrl = `${window.location.origin}/menu/public/${user.id}`;
      setQrUrl(defaultUrl);
    }
  }, [user]);

  const generateQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas || !qrUrl) return;

    QRCode.toCanvas(canvas, qrUrl, {
      width: 220,
      margin: 2,
      color: { dark: colorFg, light: colorBg },
      errorCorrectionLevel: 'M',
    }, (err) => {
      if (err) { console.error('Error generating QR canvas:', err); return; }

      if (logoData) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          const size = 44;
          const x = (canvas.width - size) / 2;
          const y = (canvas.height - size) / 2;
          ctx.fillStyle = colorBg;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x - 5, y - 5, size + 10, size + 10, 6) : ctx.fillRect(x - 5, y - 5, size + 10, size + 10);
          ctx.fill();
          ctx.drawImage(img, x, y, size, size);
        };
        img.src = logoData;
      }
    });
  };

  useEffect(() => { generateQRCode(); }, [qrUrl, colorFg, colorBg, logoData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setLogoData(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoData(null);
    setLogoName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${qrName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadSVG = () => {
    if (!qrUrl) return;
    QRCode.toString(qrUrl, { type: 'svg', width: 250, margin: 2, color: { dark: colorFg, light: colorBg } }, (err, svgString) => {
      if (err || !svgString) { alert('Erro ao gerar SVG.'); return; }
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${qrName}.svg`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open('', '_blank');
    if (!win) { alert('Por favor permita popups para imprimir.'); return; }
    const imgSrc = canvas.toDataURL('image/png');
    win.document.write(`
      <!DOCTYPE html><html><head><title>${qrName}</title>
      <style>body{font-family:'Jost',sans-serif;text-align:center;padding:3rem;}img{max-width:280px;display:block;margin:0 auto 1.5rem;border:1px solid #eee;padding:10px;border-radius:8px;}h2{margin-bottom:0.5rem;font-weight:700;color:#2a2a2a;}p{color:#888;font-size:14px;font-family:monospace;}</style>
      </head><body><h2>${qrName}</h2><img src="${imgSrc}" alt="QR Code"><p>${qrUrl}</p>
      <script>window.onload=function(){window.print();window.close();}</script></body></html>
    `);
    win.document.close();
  };

  const tables = [
    { name: 'Mesa 1', suffix: 'mesa1' },
    { name: 'Mesa 2', suffix: 'mesa2' },
    { name: 'Mesa 3', suffix: 'mesa3' },
    { name: 'Esplanada', suffix: 'esplanada' },
    { name: 'Takeaway', suffix: 'takeaway' },
  ];

  const downloadTableQR = (tableName: string, suffix: string) => {
    if (!user) return;
    const tableUrl = `${window.location.origin}/menu/public/${user.id}?table=${suffix}`;
    const tempCanvas = document.createElement('canvas');
    QRCode.toCanvas(tempCanvas, tableUrl, { width: 300, margin: 2, color: { dark: colorFg, light: colorBg } }, (err) => {
      if (err) { alert('Erro ao gerar QR Code.'); return; }
      const link = document.createElement('a');
      link.download = `${tableName}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
      <div>
        <h1 className="qr-title">QR Code Generator</h1>
        <div className="qr-grid">

          {/* Preview */}
          <div className="qr-card">
            <h3><i className="fas fa-eye"></i> Live Preview</h3>
            <div className="preview-container">
              <div className="qr-canvas-wrapper">
                <canvas ref={canvasRef} style={{ width: '220px', height: '220px' }}></canvas>
              </div>
              <div className="live-url-pill" title={qrUrl}>
                {qrUrl || 'Carregando URL...'}
              </div>
            </div>
            <div className="qr-actions-row">
              <button className="btn-secondary" onClick={downloadPNG} style={{ background: '#f5f2e8', border: 'none', color: '#333' }}>
                <i className="fas fa-file-image"></i> PNG
              </button>
              <button className="btn-secondary" onClick={downloadSVG} style={{ background: '#f5f2e8', border: 'none', color: '#333' }}>
                <i className="fas fa-file-code"></i> SVG
              </button>
              <button className="btn-primary" onClick={printQR}>
                <i className="fas fa-print"></i> Print
              </button>
            </div>
          </div>

          {/* Customizer */}
          <div className="qr-card">
            <h3><i className="fas fa-cog"></i> Customizer</h3>
            <div className="input-group">
              <label>Name / Label</label>
              <input type="text" value={qrName} onChange={(e) => setQrName(e.target.value)} placeholder="e.g. Table 1 Menu" />
            </div>
            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>Destination URL</label>
              <input type="text" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} placeholder="https://yourmenu.com" />
            </div>
            <div className="control-row" style={{ marginTop: '20px' }}>
              <div className="input-group">
                <label>Foreground Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={colorFg} onChange={(e) => setColorFg(e.target.value)} />
                  <span className="color-hex">{colorFg.toUpperCase()}</span>
                </div>
              </div>
              <div className="input-group">
                <label>Background Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={colorBg} onChange={(e) => setColorBg(e.target.value)} />
                  <span className="color-hex">{colorBg.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Overlay Logo (optional)</label>
              {!logoData ? (
                  <label className="custom-file-upload">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Choose logo image</span>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
              ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#fafafa', padding: '12px 16px', borderRadius: '10px', border: '1px solid #eee' }}>
                    <img src={logoData} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '6px', border: '1px solid #ddd' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{logoName}</div>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>Overlay logo active</span>
                    </div>
                    <button className="btn-secondary" onClick={handleClearLogo} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '0.85rem' }}>
                      Clear
                    </button>
                  </div>
              )}
            </div>
          </div>
          {/* Mesas */}
          <div className="qr-card" style={{ gridColumn: '1 / -1' }}>
            <h3><i className="fas fa-table"></i> QR Codes por Mesa</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
              {tables.map((table) => (
                  <button
                      key={table.suffix}
                      onClick={() => downloadTableQR(table.name, table.suffix)}
                      style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#f5f2e8', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <i className="fas fa-download" style={{ marginRight: '8px' }}></i>
                    {table.name}
                  </button>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}

import React, { useState } from 'react';
import { UploadCloud, FileText, Check, AlertCircle } from 'lucide-react';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            parseCSV(e.target.files[0]);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n');
            const data = [];

            // Assume Header: Brand,Model,Aliases,Diagonal,Width,Height
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = line.split(',');
                if (cols.length >= 2) {
                    data.push({
                        brand: cols[0].trim().replace(/"/g, ''),
                        model: cols[1].trim().replace(/"/g, ''),
                        aliases: cols[2] ? cols[2].trim().replace(/"/g, '') : '',
                        diagonal: cols[3] ? parseFloat(cols[3]) : undefined,
                        width: cols[4] ? parseFloat(cols[4]) : undefined,
                        height: cols[5] ? parseFloat(cols[5]) : undefined
                    });
                }
            }
            setPreview(data);
        };
        reader.readAsText(file);
    };

    const [progress, setProgress] = useState(0);

    const handleUpload = async () => {
        if (!preview.length) return;
        setIsUploading(true);
        setProgress(0);

        const BATCH_SIZE = 500;
        let totalAdded = 0;
        let totalSkipped = 0;
        let hasError = false;

        const adminToken = localStorage.getItem('adminToken');

        try {
            for (let i = 0; i < preview.length; i += BATCH_SIZE) {
                const batch = preview.slice(i, i + BATCH_SIZE);

                const res = await fetch('/api/admin/import/phones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminToken}`
                    },
                    body: JSON.stringify({ phones: batch })
                });

                if (!res.ok) {
                    throw new Error(`Batch failed: ${res.statusText}`);
                }

                const json = await res.json();
                if (json.success) {
                    totalAdded += json.added || 0;
                    totalSkipped += json.skipped || 0;
                }

                // Update Progress
                setProgress(Math.round(((i + batch.length) / preview.length) * 100));
            }

            setResult({ success: true, added: totalAdded, skipped: totalSkipped });
            setFile(null);
            setPreview([]);

        } catch (e) {
            console.error(e);
            setResult({ success: false });
            hasError = true;
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="admin-page">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UploadCloud /> Bulk Import
                </h1>
                <p style={{ color: '#64748b' }}>Upload a CSV to add thousands of phones instantly.</p>
            </header>

            <div className="card" style={{ background: 'white', padding: '40px', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>

                {result && (
                    <div style={{
                        padding: '15px', borderRadius: '8px', marginBottom: '20px',
                        background: result.success ? '#ecfdf5' : '#fef2f2',
                        color: result.success ? '#047857' : '#dc2626'
                    }}>
                        {result.success
                            ? `Success! Added ${result.added} phones (Skipped ${result.skipped}).`
                            : 'Upload failed. Check console.'}
                    </div>
                )}

                {!file ? (
                    <div
                        style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', cursor: 'pointer', background: '#f8fafc' }}
                        onClick={() => document.getElementById('csv-upload')?.click()}
                    >
                        <FileText size={48} color="#94a3b8" style={{ marginBottom: '15px' }} />
                        <h3 style={{ marginBottom: '10px' }}>Click to Upload CSV</h3>
                        <p style={{ color: '#64748b' }}>Format: Brand, Model, Aliases, [Diag, W, H]</p>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                            <FileText color="#6366f1" />
                            <span style={{ fontWeight: 600 }}>{file.name}</span>
                            <span style={{ color: '#64748b' }}>({preview.length} rows)</span>
                        </div>

                        {/* Progress Bar */}
                        {isUploading && (
                            <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '99px', height: '10px', marginBottom: '20px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, background: '#6366f1', height: '100%', transition: 'width 0.3s ease' }}></div>
                            </div>
                        )}

                        <div style={{ background: '#1e293b', color: '#e2e8f0', padding: '15px', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                            <code>
                                {preview.slice(0, 5).map((row, i) => (
                                    <div key={i}>{row.brand}, {row.model}</div>
                                ))}
                                {preview.length > 5 && <div>...and {preview.length - 5} more</div>}
                            </code>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => { setFile(null); setPreview([]); setResult(null); }}
                                disabled={isUploading}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: isUploading ? 0.7 : 1 }}
                            >
                                {isUploading ? `Importing ${progress}%...` : 'Start Import'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

import { supabase } from './_lib/supabase.js';
import { setCors, handleOptions } from './_lib/cors.js';

const BUCKET = 'documents';
const FOLDER = 'Payroll Reports';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    // GET — list payroll files
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('payroll_files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return res.json({ files: data || [] });
    }

    // POST — upload file
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      // Parse multipart manually (simple boundary parse)
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) return res.status(400).json({ error: 'Missing boundary' });

      const boundary = boundaryMatch[1];
      const parts = buffer.toString('latin1').split('--' + boundary);

      let fileBuffer = null;
      let fileName = '';
      let fileMime = '';
      let label = '';

      for (const part of parts) {
        if (part.includes('name="file"')) {
          const nameMatch = part.match(/filename="(.+?)"/);
          const typeMatch = part.match(/Content-Type:\s*(.+)/i);
          fileName = nameMatch ? nameMatch[1].trim() : 'upload.pdf';
          fileMime = typeMatch ? typeMatch[1].trim() : 'application/pdf';
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd > -1) {
            const bodyStr = part.slice(headerEnd + 4);
            const trimmed = bodyStr.endsWith('\r\n') ? bodyStr.slice(0, -2) : bodyStr;
            fileBuffer = Buffer.from(trimmed, 'latin1');
          }
        }
        if (part.includes('name="label"')) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd > -1) {
            label = part.slice(headerEnd + 4).replace(/\r\n$/, '').trim();
          }
        }
      }

      if (!fileBuffer) return res.status(400).json({ error: 'No file uploaded' });

      // Upload to storage
      const storagePath = `${FOLDER}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType: fileMime, upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

      // Save metadata
      const { data: record, error: dbError } = await supabase
        .from('payroll_files')
        .insert({
          file_name: fileName,
          label: label || fileName,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          file_type: fileMime,
          file_size: fileBuffer.length,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return res.status(201).json(record);
    }

    // DELETE — remove file
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });

      // Get file info
      const { data: file } = await supabase
        .from('payroll_files')
        .select('storage_path')
        .eq('id', id)
        .single();

      if (file?.storage_path) {
        await supabase.storage.from(BUCKET).remove([file.storage_path]);
      }

      await supabase.from('payroll_files').delete().eq('id', id);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Payroll files error:', err);
    return res.status(500).json({ error: err.message });
  }
}

# AI Cover Designer Documentation

## Fitur Utama

### 1. **Upload Logo**

- Drag & drop atau click untuk upload logo
- Support format: PNG, JPG, SVG
- Max size: 10MB

### 2. **AI Analysis dengan Gemini**

Sistem akan otomatis menganalisis logo dan memberikan:

- **Color Palette**: Primary, Secondary, dan Accent colors
- **Mood Detection**: Professional, Modern, Creative, Elegant, atau Bold
- **Industry Recognition**: Deteksi jenis bisnis/industri
- **Template Recommendations**: 3 template yang paling cocok dengan logo

### 3. **5 Template Cover Design**

#### Template 1: Geometric Patterns

- Modern geometric shapes dengan bold colors
- Cocok untuk: Tech, Startup, Modern Business
- Pattern: Circles, Squares, Triangles, Grid

#### Template 2: Fluid Waves

- Smooth flowing waves dengan gradients
- Cocok untuk: Creative Agency, Healthcare, Wellness
- Pattern: Wave shapes, Floating circles

#### Template 3: Abstract Shapes

- Creative abstract elements dengan dynamic composition
- Cocok untuk: Creative Industry, Design Agency, Art
- Pattern: Blobs, Abstract lines, Geometric elements

#### Template 4: Minimal Gradient

- Clean gradients dengan subtle patterns
- Cocok untuk: Corporate, Finance, Professional Services
- Pattern: Dots, Subtle shapes, Clean lines

#### Template 5: Modern Grid

- Contemporary grid-based design dengan depth
- Cocok untuk: Architecture, Real Estate, Construction
- Pattern: Grid cells dengan color blocks

### 4. **Customization**

- **Title**: Judul utama report
- **Subtitle**: Deskripsi atau tagline
- **Period**: Periode report (contoh: "January 2026")

### 5. **AI Recommendations**

- Template yang direkomendasikan AI akan diberi badge "AI Recommended"
- Warna otomatis disesuaikan dengan color palette dari logo
- Template pertama yang direkomendasikan akan auto-selected

## Cara Penggunaan

1. **Buka Cover Designer**
   - Klik tombol "AI Cover Designer" di halaman setup

2. **Upload Logo**
   - Drag & drop logo atau click area upload
   - Tunggu AI menganalisis (beberapa detik)

3. **Review AI Analysis**
   - Lihat hasil analisis: mood, industry, color palette
   - Perhatikan template recommendations

4. **Pilih Template**
   - Click template yang diinginkan
   - Template dengan badge "AI Recommended" adalah pilihan AI
   - Preview besar akan muncul di bawah

5. **Customize Text**
   - Edit Title, Subtitle, dan Period sesuai kebutuhan
   - Preview akan update real-time

6. **Use Design**
   - Click "Use This Design" untuk menerapkan
   - Design akan tersimpan untuk cover report

## Technical Details

### API Integration

- **Endpoint**: `/api/analyze-logo`
- **Method**: POST
- **Input**: FormData dengan file logo
- **Output**: JSON dengan analysis data

### Gemini Model

- Model: `gemini-1.5-flash`
- Vision capabilities untuk analisis logo
- Response format: JSON structured data

### Environment Variable

```
GEMINI_API_KEY=AIzaSyBo1HRwT6xSPydfqTzlRbpmFnM2baGlf_o
```

## Component Structure

```
app/
  components/
    covers/
      CoverDesigner.tsx        # Main UI component
      CoverTemplates.tsx       # 5 template implementations
  api/
    analyze-logo/
      route.ts                 # Gemini API integration
  types/
    cover.ts                   # TypeScript interfaces
```

## Dependencies

- `@google/generative-ai` - Gemini AI SDK
- `react-dropzone` - File upload component
- `tailwindcss` - Styling

## Tips untuk Hasil Terbaik

1. **Logo Quality**: Upload logo dengan resolusi tinggi dan background transparan
2. **Color Contrast**: Logo dengan warna yang jelas akan menghasilkan rekomendasi lebih akurat
3. **File Format**: SVG atau PNG dengan transparency untuk hasil terbaik
4. **AI Recommendations**: Ikuti rekomendasi AI untuk kombinasi warna yang harmonis
5. **Preview**: Selalu cek preview besar sebelum finalisasi

## Troubleshooting

### Logo tidak teranalisis

- Pastikan file format didukung (PNG, JPG, SVG)
- Cek ukuran file tidak melebihi 10MB
- Pastikan API key Gemini valid

### Template tidak muncul

- Refresh halaman
- Clear browser cache
- Cek console untuk error

### Warna tidak sesuai

- AI akan extract warna dominan dari logo
- Bisa manual edit di code jika diperlukan
- Pastikan logo memiliki warna yang jelas

## Future Enhancements

- [ ] Manual color picker
- [ ] More template options (10+)
- [ ] Export to PNG/PDF
- [ ] Save template presets
- [ ] Batch logo processing
- [ ] Custom pattern editor
- [ ] Animation options

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { HiArrowDownTray } from 'react-icons/hi2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OLF_BLUE = '#309edd';
const OLF_GREEN = '#0ea03e';
const OLF_YELLOW = '#ffd900';
const DARK_GREEN = '#0a2614';

function getServiceLabel(type, sdaCat) {
  if ((type === 'SDA' || type === 'SIL+SDA') && sdaCat) {
    const cats = {
      'High Physical Support': 'SDA-HPS',
      'Fully Accessible': 'SDA-FA',
      'Improved Liveability': 'SDA-IL',
      'Robust': 'SDA-R',
    };
    return cats[sdaCat] || `SDA-${sdaCat}`;
  }
  if (type === 'SIL+SDA') return 'SIL + SDA';
  return type || 'SIL';
}

function getServiceColor(type) {
  if (type === 'SDA' || type === 'SIL+SDA') return OLF_BLUE;
  return OLF_GREEN;
}

// Simple SVG icons as inline data (avoid external icon dependencies in canvas)
const BedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" />
  </svg>
);

const BathIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" />
    <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
  </svg>
);

const VacancyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={OLF_GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={OLF_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyProfilePDF({ property }) {
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef(null);

  const photos = property.photos || [];
  const coverPhoto = photos.find((p) => p.is_cover) || photos[0] || null;
  const galleryPhotos = photos.filter((p) => p.id !== coverPhoto?.id).slice(0, 6);
  const features = property.features || [];
  const activeResidents = (property.residents || []).filter((r) => r.status === 'active' || !r.status).length;
  const vacancies = Math.max(0, (property.capacity || 0) - activeResidents);
  const serviceLabel = getServiceLabel(property.property_type, property.sda_category);
  const serviceColor = getServiceColor(property.property_type);

  const fullAddress = [
    property.address,
    property.suburb,
    property.state,
    property.postcode,
  ].filter(Boolean).join(', ');

  // Parse nearby_amenities into lines
  const amenityLines = (property.nearby_amenities || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Convert external image URL to base64 via server proxy to avoid CORS
  async function imageToDataURL(url) {
    try {
      const proxyUrl = '/api/image-proxy?url=' + encodeURIComponent(url);
      const res = await fetch(proxyUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function exportPDF() {
    if (!pdfRef.current) return;
    setGenerating(true);

    try {
      // Pre-convert all images to base64 to avoid CORS issues with html2canvas
      const imgElements = pdfRef.current.querySelectorAll('img[data-external]');
      for (const img of imgElements) {
        const originalSrc = img.getAttribute('data-original-src') || img.src;
        if (originalSrc && !originalSrc.startsWith('data:')) {
          const dataUrl = await imageToDataURL(originalSrc);
          if (dataUrl) {
            img.src = dataUrl;
          }
        }
      }

      // Move into viewport for rendering
      pdfRef.current.style.position = 'fixed';
      pdfRef.current.style.left = '0px';
      pdfRef.current.style.top = '0px';
      pdfRef.current.style.zIndex = '99999';

      // Wait for images to settle
      await new Promise((r) => setTimeout(r, 800));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      });

      // Move back off-screen
      pdfRef.current.style.position = 'fixed';
      pdfRef.current.style.left = '-9999px';
      pdfRef.current.style.top = '0px';
      pdfRef.current.style.zIndex = '-1';

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const safeName = (property.name || 'Property').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      pdf.save(`OLF-Property-Profile-${safeName}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  // ─── Stat Pill ──────────────────────────────────────────────────────────

  const StatPill = ({ icon, value, label, color = 'white' }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(255,255,255,0.15)',
      borderRadius: '20px',
      padding: '4px 12px 4px 6px',
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', lineHeight: '1.1' }}>{value}</div>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      </div>
    </div>
  );

  // ─── Determine layout geometry ──────────────────────────────────────────
  // Adjust sections based on content available
  const hasGallery = galleryPhotos.length > 0;
  const hasFeatures = features.length > 0;
  const hasAmenities = amenityLines.length > 0;
  const hasAccessibility = !!property.accessibility;

  // Hero height varies based on gallery
  const heroHeight = hasGallery ? 400 : 480;
  const galleryRowCount = hasGallery ? Math.ceil(galleryPhotos.length / 3) : 0;
  const galleryHeight = hasGallery ? (galleryRowCount * 138 + (galleryRowCount - 1) * 4 + 8) : 0;
  const footerHeight = 42;
  const bottomSectionHeight = 1123 - heroHeight - galleryHeight - footerHeight;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={exportPDF}
        disabled={generating}
        className="flex items-center gap-2 rounded-lg bg-[#309edd] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2688c4] disabled:opacity-60"
      >
        {generating ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating...
          </>
        ) : (
          <>
            <HiArrowDownTray className="h-4 w-4" />
            Download Profile PDF
          </>
        )}
      </button>

      {/* Hidden A4 render target */}
      <div
        ref={pdfRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0px',
          zIndex: '-1',
          width: '794px',
          height: '1123px',
          background: '#ffffff',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ══════════════════════ HERO SECTION ══════════════════════ */}
        <div style={{
          position: 'relative',
          width: '794px',
          height: `${heroHeight}px`,
          overflow: 'hidden',
          background: '#1a3a2a',
        }}>
          {/* Cover photo */}
          {coverPhoto && (
            <img
              src={coverPhoto.url}
              data-external="true"
              data-original-src={coverPhoto.url}
              crossOrigin="anonymous"
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            background: `linear-gradient(to top, ${DARK_GREEN}ee, ${DARK_GREEN}99 40%, transparent)`,
          }} />

          {/* Top gradient for logo readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: `linear-gradient(to bottom, ${DARK_GREEN}88, transparent)`,
          }} />

          {/* OLF Logo circle - top right */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <img
              src="/logo.png"
              alt="One Life Foundation"
              crossOrigin="anonymous"
              style={{ width: '70px', height: '70px', objectFit: 'contain' }}
            />
          </div>

          {/* Property name + stats overlay */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            padding: '24px 30px',
          }}>
            {/* Address line */}
            {fullAddress && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
                  <MapPinIcon />
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '400',
                }}>
                  {fullAddress}
                </span>
              </div>
            )}

            {/* Property name */}
            <div style={{
              fontSize: '34px',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1.05',
              textTransform: 'uppercase',
              marginBottom: '12px',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {property.name}
            </div>

            {/* Badges & Stats row */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '14px',
            }}>
              {/* Service type badge */}
              <span style={{
                background: serviceColor,
                color: 'white',
                padding: '5px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.3px',
              }}>
                {serviceLabel}
              </span>

              {/* Vacancy pill */}
              {property.capacity > 0 && (
                <StatPill
                  icon={<VacancyIcon />}
                  value={vacancies}
                  label="Vacancies"
                  color={OLF_YELLOW}
                />
              )}

              {/* Bedrooms pill */}
              {property.bedrooms != null && (
                <StatPill
                  icon={<BedIcon />}
                  value={property.bedrooms}
                  label="Bedrooms"
                />
              )}

              {/* Bathrooms pill */}
              {property.bathrooms != null && (
                <StatPill
                  icon={<BathIcon />}
                  value={property.bathrooms}
                  label="Bathrooms"
                />
              )}
            </div>

            {/* Description box */}
            {property.description && (
              <div style={{
                background: `${OLF_BLUE}dd`,
                padding: '11px 16px',
                borderRadius: '8px',
                maxWidth: '480px',
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{
                  fontSize: '11.5px',
                  color: 'white',
                  lineHeight: '1.55',
                  fontWeight: '400',
                }}>
                  {property.description.length > 220
                    ? property.description.slice(0, 220).trim() + '...'
                    : property.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════ PHOTO GALLERY ══════════════════════ */}
        {hasGallery && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            padding: '4px 0',
            background: '#ffffff',
          }}>
            {galleryPhotos.map((photo, idx) => (
              <div key={photo.id || idx} style={{
                height: '138px',
                overflow: 'hidden',
                background: '#e2e8f0',
              }}>
                <img
                  src={photo.url}
                  data-external="true"
                  data-original-src={photo.url}
                  crossOrigin="anonymous"
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════ BOTTOM SECTION ══════════════════════ */}
        <div style={{
          display: 'flex',
          height: `${bottomSectionHeight}px`,
          padding: '20px 30px 12px 30px',
          gap: '30px',
          background: '#ffffff',
          boxSizing: 'border-box',
        }}>
          {/* LEFT COLUMN — Features + Local Area */}
          <div style={{ flex: '1', minWidth: '0' }}>
            {/* Property Features */}
            {hasFeatures && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: DARK_GREEN,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${OLF_GREEN}`,
                  display: 'inline-block',
                }}>
                  Property Features
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {features.slice(0, 12).map((feat, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ display: 'flex', flexShrink: 0 }}>
                        <CheckIcon />
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#334155',
                        lineHeight: '1.3',
                      }}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Area / Nearby Amenities */}
            {hasAmenities && (
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: DARK_GREEN,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${OLF_BLUE}`,
                  display: 'inline-block',
                }}>
                  Local Area
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {amenityLines.slice(0, 8).map((line, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ display: 'flex', flexShrink: 0, marginTop: '1px' }}>
                        <MapPinIcon />
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#334155',
                        lineHeight: '1.4',
                      }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accessibility (if no amenities, show here) */}
            {hasAccessibility && !hasAmenities && (
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: DARK_GREEN,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${OLF_BLUE}`,
                  display: 'inline-block',
                }}>
                  Accessibility
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#334155',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                }}>
                  {property.accessibility}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Map / Accessibility / Contact */}
          <div style={{ flex: '1', minWidth: '0' }}>
            {/* Accessibility info (when amenities exist, show here) */}
            {hasAccessibility && hasAmenities && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: DARK_GREEN,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '10px',
                  paddingBottom: '6px',
                  borderBottom: `2px solid ${OLF_GREEN}`,
                  display: 'inline-block',
                }}>
                  Accessibility
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#334155',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                }}>
                  {property.accessibility.length > 300
                    ? property.accessibility.slice(0, 300).trim() + '...'
                    : property.accessibility}
                </div>
              </div>
            )}

            {/* NDIS Badge area */}
            <div style={{
              background: '#f0fdf4',
              border: `1px solid ${OLF_GREEN}33`,
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: OLF_GREEN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: DARK_GREEN,
                  }}>
                    NDIS Registered Provider
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    marginTop: '1px',
                  }}>
                    One Life Foundation Pty Ltd
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                lineHeight: '1.5',
              }}>
                We are a registered NDIS provider delivering quality disability accommodation and support services across Australia.
              </div>
            </div>

            {/* Contact card */}
            {(property.property_manager || property.contact_phone) && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  Property Contact
                </div>
                {property.property_manager && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '2px',
                  }}>
                    {property.property_manager}
                  </div>
                )}
                {property.contact_phone && (
                  <div style={{
                    fontSize: '12px',
                    color: OLF_BLUE,
                    fontWeight: '500',
                  }}>
                    {property.contact_phone}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════ FOOTER BAR ══════════════════════ */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: `${footerHeight}px`,
          background: OLF_GREEN,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ display: 'flex' }}><PhoneIcon /></span>
            <span style={{
              color: 'white',
              fontSize: '11px',
              fontWeight: '600',
            }}>
              1300 ONE LIFE
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ display: 'flex' }}><GlobeIcon /></span>
            <span style={{
              color: 'white',
              fontSize: '11px',
              fontWeight: '500',
            }}>
              onelifefoundation.com.au
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ display: 'flex' }}><MailIcon /></span>
            <span style={{
              color: 'white',
              fontSize: '11px',
              fontWeight: '500',
            }}>
              info@onelifefoundation.com.au
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

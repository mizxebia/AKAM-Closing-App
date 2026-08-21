import type { DataverseFilePreview } from '../utils/dataverseFileUtils'

export type ViewerState =
  | 'empty'
  | 'loading'
  | 'ready'
  | 'error'
  | 'unsupported'

export function renderDocumentViewer(
  viewerState: ViewerState,
  filePreview: DataverseFilePreview | null,
  fileName: string,
  errorMessage: string | null
) {

  if (viewerState === 'empty') {
    return (
      <div className="document-viewer-state">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ opacity: 0.25, marginBottom: '10px' }}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#1E3A47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="#1E3A47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <strong style={{ color: '#1E3A47', opacity: 0.5, fontSize: '13px', fontWeight: 600 }}>No attachment selected</strong>
        <span style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', textAlign: 'center', maxWidth: '180px' }}>
          Click the <strong style={{ fontWeight: 600 }}>ⓘ</strong> icon on an attachment to preview it here.
        </span>
      </div>
    )
  }

  if (viewerState === 'error') {
    return (
      <div className="document-viewer-state document-viewer-error">
        <strong>
          Unable to preview file.
        </strong>

        <span>
          {errorMessage ??
            'The file could not be fetched from Dataverse.'}
        </span>
      </div>
    )
  }

  if (
    viewerState ===
    'unsupported'
  ) {
    return (
      <div className="document-viewer-state">
        <strong>
          Preview not supported
        </strong>

        <span>
          This file is present,
          but only PDF and image
          previews are available
          here.
        </span>
      </div>
    )
  }

  if (
    viewerState === 'loading'
  ) {
    return (
      <div className="document-loading-overlay">
        <div className="document-loader" />
      </div>
    )
  }

  if (
    filePreview?.previewType ===
    'image'
  ) {
    if (
      !filePreview.url.startsWith(
        'data:image/'
      )
    ) {
      return (
        <div className="document-viewer-state document-viewer-error">
          <strong>
            Unable to preview file.
          </strong>

          <span>
            The image preview URL is invalid.
          </span>
        </div>
      )
    }

    return (
      <div className="document-image-frame">
        <img
          src={filePreview.url}
          alt={fileName}
        />
      </div>
    )
  }

  if (
    filePreview?.previewType ===
    'pdf'
  ) {
    if (
      !filePreview.url.startsWith(
        'blob:'
      ) &&
      !filePreview.url.startsWith(
        'data:application/pdf;base64,JVBER'
      )
    ) {
      return (
        <div className="document-viewer-state document-viewer-error">
          <strong>
            Unable to preview file.
          </strong>

          <span>
            The PDF data returned from Dataverse is not valid.
          </span>
        </div>
      )
    }

    // Use the blob URL directly. Appending #toolbar=0 would hide the
    // download / print buttons in Chrome's built-in PDF viewer while
    // having no effect on Firefox's native UI — so we leave the toolbar
    // intact across all browsers.
    const pdfSrc = filePreview.url

    return (
      <iframe
        src={pdfSrc}
        title={fileName}
        className="document-preview-frame"
      />
    )
  }

 return filePreview ? (
  <iframe
    src={filePreview.url}
    title={fileName}
    className="document-preview-frame"
  />
) : (
    <div className="document-viewer-state document-viewer-error">
      <strong>
        Unable to preview file.
      </strong>
    </div>
  )
}

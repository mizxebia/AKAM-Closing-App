import './ProcessingDots.css'

/**
 * Renders "Processing" followed by an animated ellipsis that cycles
 * through one, two and three dots: Processing. → Processing.. → Processing...
 */
export function ProcessingDots() {
  return (
    <span className="processing-dots" aria-label="Processing" role="status">
      Processing
      <span className="processing-dots-ellipsis" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </span>
  )
}

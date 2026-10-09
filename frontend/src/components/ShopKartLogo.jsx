import logoLight from '../assets/logo.png';
import logoDark from '../assets/logo-dark.png';
import logoIcon from '../assets/logo-icon.png';

/**
 * ShopKart Brand Logo Component
 *
 * Renders the approved ShopKart brand identity:
 * - Cart symbol with 'S' monogram & speed lines
 * - Dark Navy "Shop" + Cobalt Blue "Kart"
 * - Tagline "Better Choices. Bigger Smiles."
 *
 * Supports light surfaces, dark surfaces, and responsive compact layouts.
 */
function ShopKartLogo({
  variant = 'light',
  size = 'md',
  iconOnly = false,
  className = '',
}) {
  const imgSrc = iconOnly ? logoIcon : variant === 'dark' ? logoDark : logoLight;

  return (
    <div className={`shopkart-logo-wrapper logo-${size} logo-variant-${variant} ${className}`}>
      <img
        src={imgSrc}
        alt="ShopKart — Better Choices. Bigger Smiles."
        className="shopkart-logo-img"
        loading="eager"
      />
    </div>
  );
}

export default ShopKartLogo;

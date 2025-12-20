import { AnimatePresence } from 'framer-motion';
import { AnimatedListProps } from './types';
import { StaggerContainer } from './StaggerContainer';
import { StaggerItem } from './StaggerItem';

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyComponent,
  staggerDelay = 0.08,
  className = '',
  style,
  ...props
}: AnimatedListProps<T>) {
  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <StaggerContainer staggerDelay={staggerDelay} className={className} style={style} {...props}>
      <AnimatePresence>
        {items.map((item, index) => (
          <StaggerItem key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </StaggerItem>
        ))}
      </AnimatePresence>
    </StaggerContainer>
  );
}

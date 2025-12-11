import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description?: string;
    url: string;
    duration?: string;
    thumbnail?: string;
    topics?: string[];
  } | null;
}

const VideoModal = ({ isOpen, onClose, content }: VideoModalProps) => {
  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-screen !h-screen !m-0 !p-0 !rounded-none !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none flex flex-col sm:!max-w-4xl sm:!max-h-[90vh] sm:!w-auto sm:!h-auto sm:!m-auto sm:!p-6 sm:!rounded-lg sm:!left-[50%] sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!transform">
        <DialogHeader className="p-4 sm:p-0 border-b border-slate-200 dark:border-slate-700 sm:border-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-xl font-semibold pr-8 sm:pr-0">
              {content.title}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Reproductor de video
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-0 space-y-4 min-h-0">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg sm:rounded-lg overflow-hidden w-full">
            <iframe
              src={content.url}
              title={content.title}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Video Info - Oculto en mobile para dar más espacio al video */}
          <div className="hidden sm:block space-y-3">
            {content.duration && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Duración: {content.duration}</span>
              </div>
            )}

            {content.description && (
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {content.description}
                </p>
              </div>
            )}

            {content.topics && content.topics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Temas tratados</h3>
                <div className="flex flex-wrap gap-2">
                  {content.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;

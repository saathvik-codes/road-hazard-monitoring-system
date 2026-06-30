import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isVideoUrl } from "@/lib/media";

interface MediaLightboxProps {
  url: string | null;
  onClose: () => void;
}

export function MediaLightbox({ url, onClose }: MediaLightboxProps) {
  return (
    <AnimatePresence>
      {url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            {isVideoUrl(url) ? (
              <video src={url} controls autoPlay className="w-full max-h-[80vh] rounded-xl bg-black" />
            ) : (
              <img src={url} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

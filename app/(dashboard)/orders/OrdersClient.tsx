"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, ShoppingBag, Loader2, ImagePlus, X, MoreVertical, Copy, Trash2, Edit, ChevronLeft, ChevronRight, Wand2, Sparkles, Bot, ExternalLink, Box, Car, Home, PenLine, Package, CheckCircle2, Clock, AlertCircle, ArrowRight, GripVertical, Plus, ChevronDown, Activity, Zap, LayoutDashboard } from "lucide-react"
import { useEffect, useState, useMemo, memo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { getOrdersByProject, updateBotOrder, sendOrderToBots, createBotOrder, cancelBotOrder, deleteBotOrder } from "@/lib/actions/orders"
import { getProjects } from "@/lib/actions/projects"
import { getAvailableWaFbDevices } from "@/lib/actions/devices"
import { improveTitle, improveDescription, generateProductImage, improveProductImage, analyzeVehicleImage, analyzeProductImage, type ImproveType } from "@/lib/actions/ai"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const FilePreview = memo(({ file, className }: { file: File | string, className?: string }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    if (!file) return;
    
    if (typeof file === 'string') {
      setSrc(file);
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      setSrc(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error("Error creating preview URL", e);
    }
  }, [file]);

  if (!src) return <div className="size-full flex items-center justify-center bg-muted/10"><ShoppingBag className="size-8 text-muted-foreground/20" /></div>;

  return <img src={src} alt="Preview" className={className} />;
});
FilePreview.displayName = "FilePreview";

const OrderCardImage = ({ url, alt, className }: { url: string, alt: string, className?: string }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 animate-pulse">
          <Loader2 className="size-6 text-blue-500/20 animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
};

// ─── SEGURIDAD Y VALIDACIONES ────────────────────────────────────
const FORMAT_CLEAN_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}*]/gu;

const PHONE_REGEX = /(?:\+?591)?\s?[67]\d{7}/;

const hasPhoneNumber = (text: string) => {
  return PHONE_REGEX.test(text);
};

const validateTextContent = (text: string) => {
  return { valid: true, reason: "" };
};

const SecurityWarning = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 p-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-500 w-full">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1">Aviso de Seguridad</p>
          <p className="text-[9px] text-amber-500/80 font-bold uppercase leading-tight">Prohibido subir imágenes con números de teléfono o códigos QR. La IA agregará automáticamente el número del bot designado.</p>
        </div>
      </div>
    </div>
  );
};

export default function OrdersClient() {
  const { selectedProjectId, setActiveOrderName } = useProjectStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasAnyProjects, setHasAnyProjects] = useState<boolean | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [availableBots, setAvailableBots] = useState<any[]>([])

  // Número de WhatsApp del bot principal disponible
  const mainBotPhone = (() => {
    if (!availableBots || availableBots.length === 0) return "";
    const bot = availableBots[0];
    if (!bot?.redesSociales) return "";
    const wa = (bot.redesSociales as any[]).find((r: any) => r.red_social === "whatsapp");
    return wa?.telefono_asociado || wa?.user || "";
  })();
  const CONTACT_SUFFIX = mainBotPhone ? `\n\n📲 WhatsApp: ${mainBotPhone}` : "";
  
  // Sync selected order to breadcrumbs
  useEffect(() => {
    setActiveOrderName(selectedOrder ? (selectedOrder.listingTitle || selectedOrder.orderName) : null)
  }, [selectedOrder, setActiveOrderName])

  const [isConfirmingDispatch, setIsConfirmingDispatch] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState<"CHOICE" | "FORM">("CHOICE")
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([])
  const [filter, setFilter] = useState("TODAS")
  const [typeFilter, setTypeFilter] = useState("TODOS")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [improveMenuOpen, setImproveMenuOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState<"title" | "description" | "image" | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [isVerifyingImage, setIsVerifyingImage] = useState(false)
  const [allDevices, setAllDevices] = useState<any[]>([])
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)

  // Fetch devices for the selector
  useEffect(() => {
    async function loadDevices() {
      try {
        const devs = await import("@/lib/actions/devices").then(m => m.getDevices());
        setAllDevices(devs);
      } catch (e) {
        console.error("Error loading devices", e);
      }
    }
    loadDevices();
  }, []);

  // --- DRAFT PERSISTENCE LOGIC ---
  useEffect(() => {
    // Only access localStorage after mount to avoid hydration mismatch
    const draft = localStorage.getItem(`draft_order_${selectedProjectId}`);
    if (draft) {
      try {
        const { form, step } = JSON.parse(draft);
        if (form && Object.keys(form).length > 0) {
          // No abrimos automáticamente ahora, solo marcamos que existe
          setHasDraft(true);
        }
      } catch (e) { console.error("Error restoring draft", e); }
    }
  }, [selectedProjectId]);

  const restoreDraft = () => {
    const draft = localStorage.getItem(`draft_order_${selectedProjectId}`);
    if (draft) {
      try {
        const { form, step } = JSON.parse(draft);
        setEditForm(form);
        setCreationStep(step || "CHOICE");
        setIsCreating(true);
      } catch (e) { console.error("Error restoring draft", e); }
    }
  };

  useEffect(() => {
    if (isCreating && selectedProjectId && Object.keys(editForm).length > 0) {
      const draftData = {
        form: editForm,
        step: creationStep,
        lastUpdated: Date.now()
      };
      localStorage.setItem(`draft_order_${selectedProjectId}`, JSON.stringify(draftData));
      setHasDraft(true);
    }
  }, [editForm, creationStep, isCreating, selectedProjectId]);

  const clearDraft = () => {
    if (selectedProjectId) {
      localStorage.removeItem(`draft_order_${selectedProjectId}`);
      setHasDraft(false);
    }
  };

  // Fetch all projects to check for existence/stale state
  useEffect(() => {
    getProjects().then(projs => {
      setHasAnyProjects(projs && projs.length > 0);
    });
    getAvailableWaFbDevices().then(bots => {
      setAvailableBots(bots || []);
    });
  }, [selectedProjectId]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filter === "TODAS" || o.status === filter;
      const matchType = typeFilter === "TODOS" || o.listingType === typeFilter;
      return matchStatus && matchType;
    });
  }, [filter, typeFilter, orders]);

  const editingMixedImages = useMemo(() => {
    // Si estamos editando o creando, mezclamos URLs que ya tiene el form con archivos que acabamos de meter
    if (isEditing || isCreating) {
      const urls = editForm.imageUrls || [];
      const files = editSelectedFiles || [];
      return [...urls, ...files];
    }
    // Si solo estamos viendo los detalles, usamos las URLs del pedido seleccionado
    return selectedOrder?.imageUrls || [];
  }, [isEditing, isCreating, editForm.imageUrls, editSelectedFiles, selectedOrder?.imageUrls]);

  // Sincronizar el índice cuando cambian las imágenes
  useEffect(() => {
    if (activeImageIndex >= editingMixedImages.length && editingMixedImages.length > 0) {
      setActiveImageIndex(editingMixedImages.length - 1);
    }
  }, [editingMixedImages.length]);

  // Auto-slideshow para vista previa
  useEffect(() => {
    if (!selectedOrder || isEditing || editingMixedImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % editingMixedImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedOrder, isEditing, editingMixedImages.length]);

  const handleRemoveImage = (idx: number) => {
    const urls = editForm.imageUrls || [];
    if (idx < urls.length) {
      const newUrls = urls.filter((_: any, i: number) => i !== idx);
      setEditForm({ ...editForm, imageUrls: newUrls });
    } else {
      const fileIdx = idx - urls.length;
      setEditSelectedFiles(prev => prev.filter((_, i) => i !== fileIdx));
    }
    
    if (activeImageIndex === idx) {
      setActiveImageIndex(Math.max(0, idx - 1));
    } else if (activeImageIndex > idx) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  }

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      const validFiles = files.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
          toast.error("Formato no soportado", { description: `El archivo "${file.name}" no es una imagen válida.` });
          return false;
        }
        if (file.size > 20 * 1024 * 1024) { // 20MB máx
          toast.error("Imagen demasiado grande", { description: `"${file.name}" supera los 20MB.` });
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsVerifyingImage(true);
      const toastId = toast.loading("Analizando seguridad de imágenes...");
      
      try {
        const analyzedFiles: File[] = [];
        const { analyzeImageSecurity } = await import("@/lib/actions/ai");

        for (const file of validFiles) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          const result = await analyzeImageSecurity(base64);
          if (result.safe) {
            analyzedFiles.push(file);
          } else {
            toast.error("⚠️ ADVERTENCIA DE SEGURIDAD", { 
              description: "No se permiten imágenes que incluyan números de teléfono, WhatsApp o códigos QR. El sistema añadirá automáticamente tu contacto de bot. Por favor, usa una imagen limpia.",
              duration: 6000,
            });
          }
        }
        
        if (analyzedFiles.length > 0) {
          const oldImagesLength = editingMixedImages.length;
          setEditSelectedFiles(prev => [...prev, ...analyzedFiles]);
          setActiveImageIndex(oldImagesLength);
          
          // Si es un vehículo y no hay datos, intentar analizar con IA
          if (editForm.listingType === "VEHICULO" && !editForm.listingTitle) {
            handleAutoDetectVehicle(analyzedFiles[0]);
          }
          toast.success("Imágenes analizadas correctamente", { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } catch (err) {
        toast.error("Error al validar imágenes", { id: toastId });
      } finally {
        setIsVerifyingImage(false);
      }
    }
  }

  const handleAutoDetectProduct = async (imageInput: File | string) => {
    try {
      setAiLoading("image");
      toast.info("Analizando producto con IA...");

      let imageSource: string;
      if (typeof imageInput === "string") {
        // Ya es una URL — la IA la descarga desde el servidor
        imageSource = imageInput;
      } else {
        // Es un File local — convertir a base64 data URL
        imageSource = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageInput);
        });
      }

      const analysis = await analyzeProductImage(imageSource);
      if (analysis) {
        setEditForm((prev: any) => ({
          ...prev,
          listingTitle: analysis.listingTitle || prev.listingTitle,
          listingDescription: analysis.listingDescription || prev.listingDescription,
          listingCategory: analysis.listingCategory || prev.listingCategory,
          listingCondition: analysis.listingCondition || prev.listingCondition,
        }));
        toast.success("¡Producto detectado!", { description: "Revisa y ajusta los datos generados." });
      } else {
        toast.error("No se pudo detectar el producto. Intenta con otra imagen.");
      }
    } catch (error) {
      console.error("Error auto-detecting product:", error);
      toast.error("Error al analizar la imagen.");
    } finally {
      setAiLoading(null);
    }
  }

  const handleAutoDetectVehicle = async (file: File) => {
    try {
      setAiLoading("image");
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const analysis = await analyzeVehicleImage(base64);
      if (analysis) {
        setEditForm((prev: any) => ({
          ...prev,
          listingTitle: analysis.listingTitle || prev.listingTitle,
          vehicleYear: analysis.vehicleYear || prev.vehicleYear,
          vehicleMake: analysis.vehicleMake || prev.vehicleMake,
          vehicleModel: analysis.vehicleModel || prev.vehicleModel,
          listingCategory: analysis.listingCategory || prev.listingCategory,
          listingDescription: analysis.listingDescription || prev.listingDescription
        }));
      }
    } catch (error) {
      console.error("Error auto-detecting vehicle:", error);
    } finally {
      setAiLoading(null);
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Si es un campo de texto, removemos emojis y símbolos especiales que delaten IA
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      value = value.replace(FORMAT_CLEAN_REGEX, "");
    }

    // Si es la descripción y no hay ningún teléfono detectado, pero tenemos un contacto de bot,
    // podemos ser proactivos, pero es mejor dejar que el usuario escriba y validar al final (handleSave).
    // Sin embargo, mantendremos una versión más inteligente del sufijo automático:
    if (e.target.name === "listingDescription" && CONTACT_SUFFIX) {
      const hasPhone = hasPhoneNumber(value);
      if (!hasPhone && value.length > 10 && !value.includes("WhatsApp")) {
        // Solo sugerimos añadirlo si el texto es largo y no hay rastros de contacto
        // Pero para no molestar al usuario mientras escribe, lo haremos solo en handleSave/handleCreate.
      }
    }
    
    setEditForm({ ...editForm, [e.target.name]: value })
  }

  const handleImproveTitle = async () => {
    if (!editForm.listingTitle) return;
    try {
      setAiLoading("title")
      const res = await improveTitle(editForm.listingTitle, editForm.listingCategory)
      
      if (!res.success) {
        toast.error("Error al mejorar título", { description: res.error });
        return;
      }

      let improved = res.data || editForm.listingTitle;
      
      // Sanitizar resultado de IA
      improved = improved.replace(FORMAT_CLEAN_REGEX, "");

      const val = validateTextContent(improved);
      if (!val.valid) {
        toast.error("IA generó contenido prohibido", { description: val.reason });
        return;
      }
      
      setEditForm((prev: { [key: string]: any }) => ({ ...prev, listingTitle: improved }))
    } catch (error) {
      console.error(error)
      toast.error("Error técnico al mejorar título");
    } finally {
      setAiLoading(null)
    }
  }

  const handleImproveDescription = async () => {
    try {
      setAiLoading("description")
      
      let botPhoneToPass = undefined;
      if (availableBots && availableBots.length > 0) {
        let botToDisplay = availableBots[0];
        if (isEditing && selectedOrder?.genMarketplaces?.length > 0) {
          const assignedBotId = selectedOrder.genMarketplaces[0]?.deviceId;
          if (assignedBotId) botToDisplay = selectedOrder.genMarketplaces[0].device || botToDisplay;
        }
        if (botToDisplay && botToDisplay.redesSociales) {
          const wa = botToDisplay.redesSociales.find((r:any) => r.red_social === 'whatsapp');
          if (wa) botPhoneToPass = wa.telefono_asociado || wa.user;
        }
      }

      let res = await improveDescription(
        editForm.listingTitle || "",
        editForm.listingDescription || "",
        editForm.listingCategory,
        botPhoneToPass
      )

      if (!res.success) {
        toast.error("Error al mejorar descripción", { description: res.error });
        return;
      }
      
      let improved = res.data || "";
      
      // Sanitizar resultado de IA
      improved = improved.replace(FORMAT_CLEAN_REGEX, "");

      const val = validateTextContent(improved);
      if (!val.valid) {
        toast.error("IA generó contenido prohibido", { description: val.reason });
        return;
      }

      // Asegurar que el contacto esté presente si la IA lo omitió o no detectó el número
      if (botPhoneToPass && !hasPhoneNumber(improved)) {
        improved = improved.trimEnd() + `\n\n📲 WhatsApp: ${botPhoneToPass}`;
      }
      
      setEditForm((prev: { [key: string]: any }) => ({ ...prev, listingDescription: improved }))
    } catch (error) {
      console.error(error)
    } finally {
      setAiLoading(null)
    }
  }

  const handleGenerateImage = async () => {
    if (!editForm.listingTitle) return alert("Escribe un título primero para generar la imagen");
    try {
      setAiLoading("image")
      const res = await generateProductImage(editForm.listingTitle, editForm.listingDescription || "")
      
      if (!res.success) {
        toast.error("Error al generar imagen", { description: res.error });
        return;
      }

      const url = res.data!;
      setEditForm((prev: any) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), url]
      }))
      setActiveImageIndex((editForm.imageUrls?.length || 0) + (editSelectedFiles.length || 0))
    } catch (error: any) {
      console.error(error)
      toast.error("Error técnico al generar imagen", { 
        description: error.message || "La IA tardó demasiado o el token es inválido." 
      })
    } finally {
      setAiLoading(null)
    }
  }

  const handleImproveSelectedImage = async (type: ImproveType = "CLEAN") => {
    const currentImage = editingMixedImages[activeImageIndex];
    if (!currentImage) {
      return alert("Selecciona una imagen para mejorarla");
    }

    try {
      setAiLoading("image");
      setImproveMenuOpen(false);

      // Convertir File local a data URL base64 si es necesario
      let imageSource: string;
      if (typeof currentImage === "string") {
        imageSource = currentImage;
      } else {
        // Es un File local — convertir a base64 data URL
        imageSource = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(currentImage);
        });
      }

      const res = await improveProductImage(
        imageSource,
        editForm.listingTitle || "",
        editForm.listingDescription || "",
        type
      );

      if (!res.success) {
        toast.error("Error al mejorar imagen", { description: res.error });
        return;
      }

      const improvedUrl = res.data!;
      
      // Reemplazar la imagen en el formulario
      const newUrls = [...(editForm.imageUrls || [])];
      if (typeof currentImage === "string") {
        const idx = newUrls.indexOf(currentImage);
        if (idx !== -1) newUrls[idx] = improvedUrl;
      } else {
        // Si era un archivo local, lo añadimos a imageUrls y lo quitamos de editSelectedFiles
        newUrls.push(improvedUrl);
        setEditSelectedFiles(prev => prev.filter(f => f !== currentImage));
      }

      setEditForm((prev: any) => ({ ...prev, imageUrls: newUrls }));
      toast.success("Imagen mejorada con éxito ✨");
    } catch (error: any) {
      console.error(error);
      toast.error("Error técnico al mejorar imagen", { description: error.message });
    } finally {
      setAiLoading(null);
    }
  }

  const handleDragStart = (idx: number) => {
    setDraggedImageIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropImage = (idx: number) => {
    if (draggedImageIndex === null) return;
    
    const currentImages = [...editingMixedImages];
    const draggedItem = currentImages[draggedImageIndex];
    
    currentImages.splice(draggedImageIndex, 1);
    currentImages.splice(idx, 0, draggedItem);
    
    const newUrls: string[] = [];
    const newFiles: File[] = [];
    
    currentImages.forEach(img => {
      if (typeof img === 'string') newUrls.push(img);
      else newFiles.push(img);
    });

    setEditForm({ ...editForm, imageUrls: newUrls });
    setEditSelectedFiles(newFiles);
    
    setActiveImageIndex(idx);
    setDraggedImageIndex(null);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setEditForm({ ...editForm, quantity: val });
  };

  const handleSave = async () => {
    // Validar texto
    const titleVal = validateTextContent(editForm.listingTitle || "");
    const descVal = validateTextContent(editForm.listingDescription || "");
    if (!titleVal.valid) return toast.error(titleVal.reason);
    if (descVal.valid === false) return toast.error(descVal.reason);

    // Inyección automática de contacto si no hay teléfono
    let finalDescription = editForm.listingDescription || "";
    if (!hasPhoneNumber(finalDescription) && CONTACT_SUFFIX) {
      finalDescription = finalDescription.trimEnd() + CONTACT_SUFFIX;
    }

    try {
      setSaving(true)
      let newImageUrls: string[] | undefined = undefined;
      
      if (editSelectedFiles.length > 0) {
         newImageUrls = []
         const token = process.env.NEXT_PUBLIC_UPLOAD_TOKEN;
         if (!token) throw new Error("Missing upload token");

         for (const file of editSelectedFiles) {
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.onerror = error => reject(error)
            })
            reader.readAsDataURL(file)
            const base64Data = await base64Promise

            const response = await fetch("https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                token_project: token,
                filename: `edit_${selectedOrder.id}_${Date.now()}_${file.name}`,
                file: base64Data,
                mimeType: file.type
              })
            })

            const data = await response.json()
            if (data.success && data.url) newImageUrls.push(data.url)
         }
      }

      const updated = await updateBotOrder(selectedOrder.id, {
        listingTitle: editForm.listingTitle,
        listingPrice: Number(editForm.listingPrice),
        listingCondition: editForm.listingCondition,
        listingCategory: editForm.listingCategory,
        listingDescription: finalDescription,
        listingType: editForm.listingType,
        vehicleYear: Number(editForm.vehicleYear) || undefined,
        vehicleMake: editForm.vehicleMake,
        vehicleModel: editForm.vehicleModel,
        vehicleMileage: Number(editForm.vehicleMileage) || undefined,
        propRooms: Number(editForm.propRooms) || undefined,
        propBathrooms: Number(editForm.propBathrooms) || undefined,
        propArea: Number(editForm.propArea) || undefined,
        quantity: Number(editForm.quantity) || 1,
        listingCurrency: editForm.listingCurrency,
        imageUrls: [...(editForm.imageUrls || []), ...(newImageUrls || [])]
      })
      
      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
      setSelectedOrder(updated)
      setIsEditing(false)
      setActiveImageIndex(0)
      setEditSelectedFiles([])
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedProjectId) {
      toast.error("Debes seleccionar un proyecto primero");
      return;
    }
    if (!editForm.listingTitle) return toast.error("El título es obligatorio");

    // Validar texto
    const titleVal = validateTextContent(editForm.listingTitle || "");
    const descVal = validateTextContent(editForm.listingDescription || "");
    if (!titleVal.valid) return toast.error(titleVal.reason);
    if (descVal.valid === false) return toast.error(descVal.reason);

    // Inyección automática de contacto si no hay teléfono
    let finalDescription = editForm.listingDescription || "";
    if (!hasPhoneNumber(finalDescription) && CONTACT_SUFFIX) {
      finalDescription = finalDescription.trimEnd() + CONTACT_SUFFIX;
    }

    try {
      setSaving(true)
      let newImageUrls: string[] = [];
      if (editSelectedFiles.length > 0) {
         const token = process.env.NEXT_PUBLIC_UPLOAD_TOKEN;
         if (!token) throw new Error("Missing upload token");

         for (const file of editSelectedFiles) {
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.onerror = error => reject(error)
            })
            reader.readAsDataURL(file)
            const base64Data = await base64Promise

            const response = await fetch("https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                token_project: token,
                filename: `new_${selectedProjectId}_${Date.now()}_${file.name}`,
                file: base64Data,
                mimeType: file.type
              })
            })

            const data = await response.json()
            if (data.success && data.url) newImageUrls.push(data.url)
         }
      }

      const created = await createBotOrder({
        projectId: selectedProjectId!,
        orderName: editForm.listingTitle,
        listingTitle: editForm.listingTitle,
        listingPrice: Number(editForm.listingPrice) || 0,
        listingCondition: editForm.listingCondition || "NUEVO",
        listingCategory: editForm.listingCategory || "VARIOS",
        listingDescription: finalDescription,
        listingAvailability: "DISPONIBLE",
        listingType: editForm.listingType || "ARTICULO",
        listingCurrency: editForm.listingCurrency || "BOLIVIANO",
        vehicleYear: Number(editForm.vehicleYear) || undefined,
        vehicleMake: editForm.vehicleMake,
        vehicleModel: editForm.vehicleModel,
        vehicleMileage: Number(editForm.vehicleMileage) || undefined,
        propRooms: Number(editForm.propRooms) || undefined,
        propBathrooms: Number(editForm.propBathrooms) || undefined,
        propArea: Number(editForm.propArea) || undefined,
        quantity: Number(editForm.quantity) || 1,
        imageUrls: newImageUrls
      })
      
      setOrders([created, ...orders])
      setIsCreating(false)
      setEditForm({})
      setEditSelectedFiles([])
      clearDraft()
      toast.success("Publicación creada correctamente");
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Error al crear la publicación");
    } finally {
      setSaving(false)
    }
  }

  const handleSendToBots = async () => {
    setIsConfirmingDispatch(true);
  }

  const executeDispatch = async () => {
    if (!selectedOrder) return;
    try {
      setSaving(true)
      const updated = await sendOrderToBots(selectedOrder.id)
      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
      setSelectedOrder(updated)
      setIsConfirmingDispatch(false)
      toast.success("🚀 Publicación preparada exitosamente")
    } catch (e: any) {
      console.error(e)
      if (e.message === "No hay dispositivos disponibles") {
        toast.error("¡Atención!", {
          description: "No encontramos bots libres para esta tarea. Libera un dispositivo o intenta nuevamente en unos minutos.",
          duration: 5000
        })
      } else {
        toast.error("Error al enviar", {
          description: "No pudimos procesar el envío. Por favor, revisa tu conexión."
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const inlineSendToBots = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    try {
      setSaving(true)
      const updated = await sendOrderToBots(orderId)
      setOrders(orders.map(o => o.id === orderId ? updated : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated)
      }
      toast.success("🚀 Publicación preparada exitosamente")
    } catch (error: any) {
      console.error(error)
      if (error.message === "No hay dispositivos disponibles") {
        toast.error("¡Atención!", {
          description: "No encontramos bots libres para esta tarea. Libera un dispositivo o intenta nuevamente en unos minutos.",
          duration: 5000
        })
      } else {
        toast.error("Error al enviar", {
          description: "No pudimos procesar el envío. Por favor, revisa tu conexión."
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setSaving(true)
    try {
      const duplicated = await createBotOrder({
        projectId: order.projectId,
        orderName: order.orderName + " (Copia)",
        listingTitle: order.listingTitle,
        listingPrice: Number(order.listingPrice?.$numberDecimal || order.listingPrice) || 0,
        listingCategory: order.listingCategory,
        listingCondition: order.listingCondition,
        listingDescription: order.listingDescription,
        listingAvailability: order.listingAvailability || "DISPONIBLE",
        listingType: order.listingType || "ARTICULO",
        listingCurrency: order.listingCurrency || "BOLIVIANO",
        vehicleYear: order.vehicleYear,
        vehicleMake: order.vehicleMake,
        vehicleModel: order.vehicleModel,
        vehicleMileage: order.vehicleMileage,
        propRooms: order.propRooms,
        propBathrooms: order.propBathrooms,
        propArea: order.propArea,
        quantity: order.quantity || 1,
        imageUrls: order.imageUrls || []
      })
      setOrders([duplicated, ...orders])
      setSelectedOrder(duplicated)
      setEditForm({
        ...duplicated,
        listingPrice: Number(duplicated.listingPrice?.$numberDecimal || duplicated.listingPrice) || 0
      })
      setIsEditing(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setSaving(true)
    try {
      const updated = await cancelBotOrder(orderId)
      setOrders(orders.map(o => o.id === orderId ? updated : o))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setMenuOpenId(null)
    if (!confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return
    setSaving(true)
    try {
      await deleteBotOrder(orderId)
      setOrders(orders.filter(o => o.id !== orderId))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!selectedOrder) return;
    const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrder.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = filteredOrders.length - 1;
    if (nextIndex >= filteredOrders.length) nextIndex = 0;

    setSelectedOrder(filteredOrders[nextIndex]);
    setActiveImageIndex(0);
    setIsEditing(false);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) handleNavigate('next');
    else if (distance < -minSwipeDistance) handleNavigate('prev');
    setTouchStart(null);
  }

  const refreshOrders = async (showLoading = false) => {
    if (!selectedProjectId) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getOrdersByProject(selectedProjectId);
      setOrders(data);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders(true);

    const interval = setInterval(() => {
      refreshOrders(false);
    }, 20000);

    return () => clearInterval(interval);
  }, [selectedProjectId]);

  const formatPrice = (price: any) => {
    const num = parseFloat(price?.$numberDecimal || price || "0");
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const statusLabel: Record<string, string> = {
    LISTA: "LISTA PARA BOT",
    GENERANDO: "PUBLICANDO...",
    GENERADA: "PUBLICADA",
    COMPLETADA: "COMPLETADA",
    CANCELADA: "CANCELADA",
    PAUSADA: "PAUSADA",
    REINTENTAR: "REINTENTANDO",
    FALLIDA: "FALLIDA",
  }

  useEffect(() => {
    if (isCreating || selectedOrder) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isCreating, selectedOrder]);

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Mis <span className="text-blue-500">publicaciones</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {selectedProjectId ? "Aquí puedes ver el estado de todas tus publicaciones." : "Selecciona un proyecto para ver sus publicaciones."}
          </p>
        </div>

        {selectedProjectId && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={() => { setEditForm({ listingCategory: "VARIOS", listingCondition: "NUEVO", quantity: 1, listingType: "ARTICULO" }); setEditSelectedFiles([]); setIsCreating(true); setCreationStep("CHOICE"); setActiveImageIndex(0); clearDraft(); }}
              className="h-14 md:h-10 px-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              + Nueva Publicación
            </button>
            <div className="relative group flex-1 min-w-[140px] sm:min-w-0 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Buscar..." className="w-full sm:w-44 lg:w-56 bg-card border border-border px-4 py-2.5 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-foreground" />
            </div>
            <div className="flex flex-wrap items-center bg-card border border-border shadow-sm p-1 gap-1 w-full sm:w-auto">
              <button 
                onClick={() => setTypeFilter("TODOS")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'TODOS' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}
              >
                <LayoutDashboard className="size-3" />
                <span className="hidden sm:inline">TODOS</span>
              </button>
              <button 
                onClick={() => setTypeFilter("ARTICULO")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'ARTICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}
              >
                <Package className="size-3" />
                <span className="hidden sm:inline">ARTÍCULOS</span>
                {typeFilter === 'ARTICULO' && <span className="sm:hidden font-black">🛍️</span>}
              </button>
              <button 
                onClick={() => setTypeFilter("VEHICULO")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'VEHICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-amber-500'}`}
              >
                <Car className="size-3" />
                <span className="hidden sm:inline">VEHÍCULOS</span>
                {typeFilter === 'VEHICULO' && <span className="sm:hidden font-black">🚗</span>}
              </button>
              <button 
                onClick={() => setTypeFilter("PROPIEDAD")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'PROPIEDAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-emerald-500'}`}
              >
                <Home className="size-3" />
                <span className="hidden sm:inline">INMUEBLES</span>
                {typeFilter === 'PROPIEDAD' && <span className="sm:hidden font-black">🏠</span>}
              </button>
            </div>
            <div className="relative group flex-1 min-w-[140px] sm:min-w-0 sm:flex-none">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-10 w-full sm:w-44 bg-card border border-border pl-9 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-1 focus:ring-blue-500 rounded-none hover:bg-muted/50 transition-all">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <SelectValue placeholder="ESTADO: TODOS" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
                  <SelectItem value="TODAS" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">TODAS LAS ÓRDENES</SelectItem>
                  <SelectItem value="LISTA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PENDIENTES</SelectItem>
                  <SelectItem value="GENERANDO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-blue-500">PUBLICANDO...</SelectItem>
                  <SelectItem value="GENERADA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-green-500">COMPLETADAS</SelectItem>
                  <SelectItem value="CANCELADA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-500">CANCELADAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT STATE CHECK */}
      {!selectedProjectId ? (
        <div className="h-96 border border-dashed border-border flex flex-col items-center justify-center gap-4 text-center p-8 bg-muted/5">
          <ShoppingBag className="size-12 text-muted-foreground/10" />
          <div className="max-w-xs">
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Proyecto no seleccionado</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-wider leading-relaxed">
              {hasAnyProjects === false 
                ? "No tienes ningún proyecto creado. Crea tu primer proyecto para empezar." 
                : "Utiliza el menú lateral para seleccionar un proyecto y gestionar tus publicaciones."}
            </p>
          </div>
          {hasAnyProjects === false && (
            <Link 
              href="/projects"
              className="mt-2 h-11 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Box className="size-4" />
              Crear Proyecto
            </Link>
          )}
        </div>
      ) : loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-10 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Sincronizando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 content-start auto-rows-max">
           {/* DRAFT CARD */}
           {hasDraft && !isCreating && (
             <div className="group relative bg-blue-600/5 border-2 border-dashed border-blue-500/30 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500 min-h-[220px]">
                <div className="size-12 bg-blue-600/10 flex items-center justify-center rounded-full">
                  <Sparkles className="size-6 text-blue-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1">Borrador Pendiente</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium max-w-[150px] mx-auto opacity-70">
                    Tienes una publicación a medio terminar.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-2 pt-2">
                  <button 
                    onClick={restoreDraft}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <PenLine className="size-3" /> Continuar Editando
                  </button>
                  <button 
                    onClick={clearDraft}
                    className="w-full h-10 border border-border hover:bg-red-500/10 hover:text-red-500 text-muted-foreground text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                  >
                    Descartar
                  </button>
                </div>
             </div>
           )}

          {filteredOrders.map((order) => (
            <div key={order.id} onClick={() => { setSelectedOrder(order); setActiveImageIndex(0); }} className="group relative bg-card border border-border flex flex-col overflow-hidden hover:border-blue-500 transition-all duration-500 shadow-sm hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
              <div className="relative aspect-square bg-muted/20 border-b border-border overflow-hidden">
                {order.imageUrls && order.imageUrls.length > 0 ? (
                  <OrderCardImage url={order.imageUrls[0]} alt={order.orderName} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><img src="/iconTeloVendo.svg" alt="Logo" className="size-20 opacity-5 dark:invert" /></div>
                )}
                <div className="absolute top-3 left-3 z-10"><span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none shadow-xl backdrop-blur-md border ${order.status === 'CANCELADA' ? 'bg-red-500/80 border-red-500/20 text-white' : order.status === 'LISTA' ? 'bg-amber-500/80 border-amber-500/20 text-white' : order.status === 'GENERANDO' ? 'bg-blue-600 border-blue-500/20 text-white animate-pulse' : 'bg-green-600 border-green-500/20 text-white'}`}>{statusLabel[order.status] ?? order.status}</span></div>
              </div>
              <div className="p-2 md:p-4 flex flex-col flex-1 gap-1 md:gap-2 bg-gradient-to-b from-card to-muted/10">
                <div className="text-sm md:text-xl font-black text-blue-500 tabular-nums tracking-tighter">
                  {order.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(order.listingPrice)}
                </div>
                <h3 className="text-[10px] md:text-sm font-bold text-foreground line-clamp-1 leading-none uppercase tracking-tight">{order.listingTitle || order.orderName}</h3>
                <p className="hidden md:block text-[10px] text-muted-foreground line-clamp-2 leading-relaxed opacity-70">{order.listingDescription || "Publicación sin descripción detallada."}</p>
                <div className="mt-auto pt-3 md:pt-4 flex items-center justify-between border-t border-border/50 gap-3">
                   <div className="flex flex-col gap-0.5 min-w-0">
                     <div className="flex items-center gap-1.5 min-w-0">
                       <Bot className="size-3 text-blue-500 shrink-0" />
                       <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest truncate">{order.quantity || 1} Bots</span>
                     </div>
                     {(() => {
                       const mainGen = order.genMarketplaces?.find((g: any) => g.device?.redesSociales);
                       if (!mainGen?.device?.redesSociales) return null;
                       const wa = (mainGen.device.redesSociales as any[]).find((r: any) => r.red_social === "whatsapp");
                       const phone = wa?.telefono_asociado || wa?.user;
                       if (!phone) return null;
                       return (
                         <div className="flex items-center gap-1.5">
                           <div className="size-1 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                           <span className="text-[10px] font-bold text-emerald-500 tabular-nums truncate">{phone}</span>
                         </div>
                       );
                     })()}
                   </div>
                  {order.status === "LISTA" ? (
                    <button 
                      onClick={(e) => inlineSendToBots(e, order.id)} 
                      disabled={saving} 
                      className="h-12 md:h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 shrink-0"
                    >
                      {saving ? <Loader2 className="size-3 animate-spin"/> : <><Zap className="size-3 fill-current" /> Enviar</>}
                    </button>
                  ) : (
                    <Link 
                      href={`/generations/${order.id}`} 
                      onClick={(e) => e.stopPropagation()} 
                      className="h-12 md:h-9 px-4 bg-muted hover:bg-muted/80 text-foreground border border-border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 shrink-0 group/btn"
                    >
                      <Activity className="size-3 text-blue-500 group-hover/btn:animate-pulse" /> 
                      <span>VER Ejecución</span>
                    </Link>
                  )}
                </div>
              </div>
              <div className="absolute top-3 right-3 z-20">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === order.id ? null : order.id); }} className={`size-8 flex items-center justify-center bg-card/80 border border-border text-foreground backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white rounded-full cursor-pointer ${menuOpenId === order.id ? 'bg-blue-600 text-white shadow-xl' : ''}`}><MoreVertical className="size-4" /></button>
                {menuOpenId === order.id && (
                  <div className="absolute top-10 right-0 w-48 bg-card border border-border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 rounded-none">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setSelectedOrder(order); setEditForm({...order}); setIsEditing(true); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-muted transition-colors border-b border-border cursor-pointer"><Edit className="size-3 text-blue-500" /> Editar</button>
                    <button onClick={(e) => handleDuplicate(e, order)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-muted transition-colors border-b border-border cursor-pointer"><Copy className="size-3 text-green-500" /> Duplicar</button>
                    <button onClick={(e) => handleDelete(e, order.id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"><Trash2 className="size-3" /> Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && !hasDraft && (
            <div className="col-span-full h-96 border border-dashed border-border flex flex-col items-center justify-center gap-5 text-center p-8 bg-muted/5 animate-in fade-in zoom-in duration-700">
              <div className="size-20 bg-blue-500/5 rounded-full flex items-center justify-center border border-blue-500/10">
                <ShoppingBag className="size-10 text-blue-500/30" />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">No hay publicaciones registradas</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed font-medium">
                  Este proyecto aún no tiene publicaciones. Comienza creando una ahora mismo para que tus bots puedan empezar a trabajar.
                </p>
              </div>
              <button 
                onClick={() => { setEditForm({ listingCategory: "VARIOS", listingCondition: "NUEVO", quantity: 1, listingType: "ARTICULO" }); setEditSelectedFiles([]); setIsCreating(true); setCreationStep("CHOICE"); setActiveImageIndex(0); clearDraft(); }}
                className="h-12 px-10 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                + Nueva Publicación
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATION MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-2xl p-0 md:p-8 flex items-start md:items-center justify-center overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setIsCreating(false) }}>
          <div className="relative w-full max-w-5xl h-auto bg-card border border-white/5 shadow-[0_0_80px_rgba(37,99,235,0.1)] flex flex-col md:flex-row md:max-h-[90vh] md:overflow-hidden">
             <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 size-10 bg-white/5 flex items-center justify-center hover:bg-red-500 text-white transition-all z-[70] border border-white/10 group active:scale-90 cursor-pointer"><X className="size-5 group-hover:rotate-90 transition-transform duration-300" /></button>
             
             {creationStep === "CHOICE" ? (
               <div className="flex-1 p-8 md:p-16 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-3 mb-4"><div className="h-6 w-1.5 bg-blue-500" /><h3 className="text-xl font-black uppercase tracking-[0.3em] text-foreground">Seleccionar Tipo</h3></div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-12 opacity-60">¿Qué tipo de publicación deseas crear hoy?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                    <button onClick={() => { 
                      setEditForm({...editForm, listingType: "ARTICULO", listingCategory: "VARIOS", quantity: 1, listingDescription: CONTACT_SUFFIX.trimStart()}); 
                      setCreationStep("FORM"); 
                    }} className="group p-6 md:p-8 border border-border bg-muted/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Box className="size-16 translate-x-4 -translate-y-4" /></div>
                      <div className="size-12 md:size-16 bg-blue-500/10 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform"><Box className="size-6 md:size-8 text-blue-500" /></div>
                      <div className="space-y-1 z-10"><h4 className="text-xs font-black uppercase tracking-widest">Artículos</h4><p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-medium">Ropa, Electrónica, Hogar...</p></div>
                    </button>
                    <button onClick={() => { 
                      setEditForm({...editForm, listingType: "VEHICULO", listingCategory: "AUTOS_Y_CAMIONETAS", quantity: 1, listingDescription: CONTACT_SUFFIX.trimStart()}); 
                      setCreationStep("FORM"); 
                    }} className="group p-6 md:p-8 border border-border bg-muted/20 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center flex flex-col items-center gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Car className="size-16 translate-x-4 -translate-y-4" /></div>
                      <div className="size-12 md:size-16 bg-amber-500/10 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform"><Car className="size-6 md:size-8 text-amber-500" /></div>
                      <div className="space-y-1 z-10"><h4 className="text-xs font-black uppercase tracking-widest">Vehículos</h4><p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-medium">Autos, Motos, Camiones...</p></div>
                    </button>
                    <button onClick={() => { 
                      setEditForm({...editForm, listingType: "PROPIEDAD", listingCategory: "ALQUILER_PROPIEDADES", quantity: 1, listingDescription: CONTACT_SUFFIX.trimStart()}); 
                      setCreationStep("FORM"); 
                    }} className="group p-6 md:p-8 border border-border bg-muted/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center flex flex-col items-center gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Home className="size-16 translate-x-4 -translate-y-4" /></div>
                      <div className="size-12 md:size-16 bg-emerald-500/10 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform"><Home className="size-6 md:size-8 text-emerald-500" /></div>
                      <div className="space-y-1 z-10"><h4 className="text-xs font-black uppercase tracking-widest">Propiedades</h4><p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-medium">Venta y Alquiler de Inmuebles</p></div>
                    </button>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
                 <div className="w-full md:w-[45%] bg-muted/20 flex flex-col border-b md:border-b-0 md:border-r border-border p-4 md:p-6 shrink-0 md:overflow-y-auto custom-scrollbar">
                     <div className="relative aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden border border-border shadow-inner group/preview">
                       {editingMixedImages.length > 0 ? (
                         <>
                           <FilePreview file={editingMixedImages[activeImageIndex] || editingMixedImages[0]} className="w-full h-full object-contain" />
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleRemoveImage(activeImageIndex); }}
                             className="absolute top-4 right-4 size-10 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-all z-30 shadow-2xl hover:bg-black cursor-pointer border border-white/10"
                             title="Quitar esta imagen"
                           >
                             <Trash2 className="size-5" />
                           </button>
                         </>
                       ) : (
                         <div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/5 animate-pulse" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Subir Imagen Principal</p></div>
                       )}
                     </div>
                    {editingMixedImages.length > 0 && (
                      <div className="bg-background/20 mt-4 p-3 border border-border/50 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        {editingMixedImages.map((img: any, idx: number) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropImage(idx)}
                            className="relative group shrink-0"
                          >
                            <button 
                              onClick={() => setActiveImageIndex(idx)} 
                              className={`size-16 shrink-0 border-2 transition-all cursor-move ${activeImageIndex === idx ? 'border-blue-500 scale-105 shadow-2xl z-10' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                              <FilePreview file={img} className="w-full h-full object-cover" />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                              className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg hover:bg-red-600 scale-0 group-hover:scale-100"
                            >
                              <X className="size-3" />
                            </button>
                            {idx === 0 && (
                              <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 z-20 shadow-lg">Portada</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <label className={`border border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isVerifyingImage ? 'border-blue-600 bg-blue-600/5 cursor-wait' : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'}`}>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} disabled={isVerifyingImage} />
                         {isVerifyingImage ? <Loader2 className="size-5 text-blue-600 animate-spin" /> : <ImagePlus className="size-5 text-blue-500 group-hover:scale-125 transition-transform duration-500" />}
                         <p className={`text-[8px] font-black uppercase tracking-widest ${isVerifyingImage ? 'text-blue-600 animate-pulse' : 'text-blue-500'}`}>{isVerifyingImage ? 'Analizando' : 'Subir'}</p>
                      </label>
                      <div className="relative group">
                        <button onClick={() => setImproveMenuOpen(!improveMenuOpen)} disabled={aiLoading === "image" || !editingMixedImages[activeImageIndex]} className="w-full h-full border border-dashed border-amber-500/30 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 transition-all group disabled:opacity-50">
                           {aiLoading === "image" ? <Loader2 className="size-5 text-amber-500 animate-spin" /> : <Wand2 className="size-5 text-amber-500 group-hover:scale-125 transition-transform duration-500" />}
                           <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Mejorar IA</p>
                        </button>
                        {improveMenuOpen && (
                          <div className="absolute bottom-full left-0 w-full mb-2 bg-card border border-border shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => handleImproveSelectedImage("CLEAN")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors border-b border-border cursor-pointer"><Sparkles className="size-3 text-blue-500" /> Fondo Blanco</button>
                            <button onClick={() => handleImproveSelectedImage("PERSPECTIVE")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors border-b border-border cursor-pointer"><ImagePlus className="size-3 text-amber-500" /> Perspectiva 3D</button>
                            <button onClick={() => handleImproveSelectedImage("STUDIO")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors cursor-pointer"><Bot className="size-3 text-green-500" /> Foto Profesional</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editForm.listingType === "VEHICULO" && editSelectedFiles.length > 0 && (
                      <button 
                        onClick={() => handleAutoDetectVehicle(editSelectedFiles[activeImageIndex])}
                        className="w-full mt-2 h-10 border border-blue-500/30 bg-blue-500/5 text-[9px] font-black uppercase text-blue-500 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        disabled={aiLoading === "image"}
                      >
                         {aiLoading === "image" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Detectar Características con IA
                      </button>
                    )}
                    {editForm.listingType === "ARTICULO" && editingMixedImages.length > 0 && (
                      <button 
                        onClick={() => handleAutoDetectProduct(editingMixedImages[activeImageIndex])}
                        className="w-full mt-2 h-10 border border-blue-500/30 bg-blue-500/5 text-[9px] font-black uppercase text-blue-500 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        disabled={aiLoading === "image"}
                      >
                        {aiLoading === "image" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Detectar Producto con IA
                      </button>
                    )}
                    <button 
                      onClick={() => setCreationStep("CHOICE")} 
                      className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/60 hover:text-blue-500 transition-all cursor-pointer group py-2"
                    >
                      <ChevronLeft className="size-3 group-hover:-translate-x-1 transition-transform" /> 
                      Regresar a Selección de Tipo
                    </button>
                 </div>
                 <div className="flex-1 bg-card p-6 md:p-10 space-y-6 md:overflow-y-auto custom-scrollbar">
                   <SecurityWarning visible={editingMixedImages.length > 0} />
                   <div className="mb-4 flex items-center gap-3">
                     <div className="h-6 w-1.5 bg-blue-500" />
                     <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
                       {isEditing ? "Editar Publicación: " : "Nueva Publicación: "} {editForm.listingType === "VEHICULO" ? "Vehículo" : editForm.listingType === "PROPIEDAD" ? "Propiedad" : "Artículo"}
                     </h3>
                   </div>
                   
                   {/* SECCION BOT SUGERIDO/ASIGNADO */}
                   {(isEditing || isCreating) && availableBots.length > 0 && (
                     <div className="p-4 bg-blue-500/5 border border-blue-500/20 w-full mb-6 relative overflow-hidden group">
                       <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                       <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-3 flex items-center gap-2">
                         <Bot className="size-3.5" /> Bot Principal {isEditing && selectedOrder?.genMarketplaces?.length > 0 ? "Asignado" : "Sugerido"}
                       </p>
                       {(() => {
                         let botToDisplay = availableBots[0];
                         if (isEditing && selectedOrder?.genMarketplaces?.length > 0) {
                           // Try to show the actually assigned bot if available in genMarketplaces
                           const assignedBotId = selectedOrder.genMarketplaces[0]?.deviceId;
                           if (assignedBotId) {
                             // we just show the name if we don't have redesSociales populated here, but usually genMarketplace fetches device
                             botToDisplay = selectedOrder.genMarketplaces[0].device || botToDisplay;
                           }
                         }

                         if (!botToDisplay || !botToDisplay.redesSociales) return <p className="text-[9px] text-muted-foreground uppercase font-black">Información no disponible</p>;
                         
                         const wa = botToDisplay.redesSociales?.find?.((r:any) => r.red_social === 'whatsapp');
                         const fb = botToDisplay.redesSociales?.find?.((r:any) => r.red_social === 'facebook');

                         return (
                           <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                             <div className="flex flex-col">
                               <span className="text-[11px] font-black text-foreground uppercase">{botToDisplay.serial || "SIN ASIGNAR"}</span>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase">{botToDisplay.personName || "Operador Desconocido"}</span>
                             </div>
                             <div className="h-6 w-px bg-border hidden md:block" />
                             <div className="flex flex-wrap items-center gap-3">
                               {wa && (
                                 <div className="flex items-center gap-1.5" title="WhatsApp">
                                   <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 border border-emerald-500/20">WA</span>
                                   <span className="text-[11px] font-mono font-black text-foreground">{wa.telefono_asociado || wa.user || "S/N"}</span>
                                 </div>
                               )}
                               {fb && (
                                 <div className="flex items-center gap-1.5" title="Facebook">
                                   <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 border border-blue-500/20">FB</span>
                                   <span className="text-[10px] font-bold text-foreground opacity-80">{fb.user || "N/A"}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   )}

                   <div className="space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                           <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Título de la publicación</Label>
                           <button onClick={handleImproveTitle} disabled={aiLoading === "title" || !editForm.listingTitle} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 cursor-pointer">
                             {aiLoading === "title" ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />} Mejorar con IA
                           </button>
                        </div>
                        <Input className="h-12 bg-muted/20 border border-border text-[11px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all px-4" name="listingTitle" value={editForm.listingTitle || ""} onChange={handleEditChange} placeholder={editForm.listingType === "VEHICULO" ? "Ej: Toyota Hilux 2023 Full Equipo" : editForm.listingType === "PROPIEDAD" ? "Ej: Departamento en Miraflores 3 Dorm" : "Escribe el nombre del producto..."} />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5 flex flex-col">
                          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Monto y Divisa</Label>
                          <div className="flex items-stretch border border-border bg-muted/20 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300 w-full overflow-hidden h-12 rounded-none">
                            <Input 
                              type="number" 
                              className="h-full flex-1 border-none bg-transparent text-sm font-black text-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 placeholder:text-muted-foreground/30" 
                              name="listingPrice" 
                              value={editForm.listingPrice || ""} 
                              onChange={handleEditChange} 
                              placeholder="0.00"
                            />
                            <div className="border-l border-border bg-muted/30 px-1 flex items-center shrink-0">
                               <Select value={editForm.listingCurrency || "BOLIVIANO"} onValueChange={v => setEditForm({...editForm, listingCurrency: v})}>
                                 <SelectTrigger className="w-14 h-full border-none bg-transparent text-[10px] font-black uppercase shadow-none focus:ring-0 cursor-pointer flex flex-row-reverse gap-2">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="z-[100] border-border bg-card">
                                   <SelectItem value="BOLIVIANO" className="text-[10px] font-black uppercase cursor-pointer">BOL</SelectItem>
                                   <SelectItem value="DOLAR" className="text-[10px] font-black uppercase cursor-pointer">USD</SelectItem>
                                 </SelectContent>
                               </Select>
                            </div>
                          </div>
                        </div>
                          <div className="md:col-span-2 space-y-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border border-border p-4 bg-muted/5">
                              <div className="flex items-center gap-4">
                                <div className="size-10 bg-blue-600/10 flex items-center justify-center border border-blue-500/20"><Bot className="size-5 text-blue-500" /></div>
                                <div className="flex flex-col">
                                   <Label className="text-[14px] font-black uppercase tracking-widest text-foreground">Cantidad de Bots</Label>
                                   <div className="flex items-center gap-1.5">
                                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Asignación Automática</span>
                                   </div>
                                </div>
                              </div>
                              <div className="relative group">
                                <Input 
                                  type="number" 
                                  className="h-12 w-24 bg-muted/20 border-2 border-blue-600/30 text-xl font-black text-center focus:ring-0 focus:border-blue-500 transition-all rounded-none" 
                                  value={editForm.quantity} 
                                  onChange={handleQuantityChange}
                                  min={1}
                                />
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white size-5 flex items-center justify-center text-[10px] font-black rounded-none shadow-lg">#</div>
                              </div>
                            </div>
                          </div>
                      </div>

                      {/* CAMPOS DINÁMICOS SEGÚN TIPO */}
                      {editForm.listingType === "VEHICULO" && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Año</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleYear" value={editForm.vehicleYear || ""} onChange={handleEditChange} placeholder="2024" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Kilometraje (km)</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleMileage" value={editForm.vehicleMileage || ""} onChange={handleEditChange} placeholder="0" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Marca</Label><Input className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleMake" value={editForm.vehicleMake || ""} onChange={handleEditChange} placeholder="Toyota" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Modelo</Label><Input className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleModel" value={editForm.vehicleModel || ""} onChange={handleEditChange} placeholder="Hilux" /></div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Tipo de Vehículo</Label>
                            <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                              <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <SelectValue placeholder="Seleccionar tipo..." />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {["AUTOS_Y_CAMIONETAS", "MOTOS", "STATION_WAGON", "SUB_BUS_Y_MINIBUS", "CAMIONES_Y_MAQUINARIA"].map(c => (
                                  <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase">{c.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {editForm.listingType === "PROPIEDAD" && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Hab.</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propRooms" value={editForm.propRooms || ""} onChange={handleEditChange} /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Baños</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propBathrooms" value={editForm.propBathrooms || ""} onChange={handleEditChange} /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">m²</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propArea" value={editForm.propArea || ""} onChange={handleEditChange} /></div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Tipo de Propiedad</Label>
                            <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                              <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <SelectValue placeholder="Seleccionar tipo..." />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                {["ALQUILER_PROPIEDADES", "VENTA_PROPIEDADES", "TERRENOS_Y_LOTES", "LOCALES_Y_OFFICINAS"].map(c => (
                                  <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase">{c.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {editForm.listingType === "ARTICULO" && (
                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Categoría</Label>
                            <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                              <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" className="z-[100]">
                                {["VARIOS", "ELECTRONICA", "ROPA_Y_ACCESORIOS", "HOGAR_Y_JARDIN", "JUGUETES_Y_JUEGOS", "DEPORTES", "INSTRUMENTOS_MUSICALES", "MUEBLES", "ELECTRODOMESTICOS"].map(c => (
                                  <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase">{c.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Condición</Label>
                            <Select value={editForm.listingCondition} onValueChange={v => setEditForm({...editForm, listingCondition: v})}>
                              <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" className="z-[100]">
                                <SelectItem value="NUEVO">NUEVO</SelectItem>
                                <SelectItem value="USADO_COMO_NUEVO">COMO NUEVO</SelectItem>
                                <SelectItem value="USADO_BUENO">BUENO</SelectItem>
                                <SelectItem value="USADO_REGULAR">REGULAR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                         <div className="flex items-center justify-between">
                           <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Descripción Detallada</Label>
                           <button onClick={handleImproveDescription} disabled={aiLoading === "description"} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50">
                             {aiLoading === "description" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Mejorar con IA
                           </button>
                         </div>
                         <Textarea className="min-h-[140px] bg-muted/20 border-border text-xs leading-relaxed resize-none p-4 focus:ring-2 focus:ring-blue-500" name="listingDescription" value={editForm.listingDescription || ""} onChange={(e) => {
                           const val = e.target.value;
                           if (!val.includes(CONTACT_SUFFIX.trimStart())) {
                             setEditForm({...editForm, listingDescription: val + CONTACT_SUFFIX});
                           } else {
                             handleEditChange(e);
                           }
                         }} placeholder="Describe detalladamente el producto..." />
                      </div>
                   </div>
                   <div className="pt-6 flex gap-3"><button onClick={() => setIsCreating(false)} className="flex-1 h-14 text-[11px] font-black uppercase tracking-[0.2em] border border-border hover:bg-muted transition-all cursor-pointer">Cancelar</button><button disabled={saving} onClick={handleCreate} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-blue-600/30">{saving ? <Loader2 className="size-5 animate-spin"/> : "CREAR PUBLICACIÓN"}</button></div>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* VIEW / EDIT MODAL */}
      {selectedOrder && !isCreating && (
        <div 
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xl p-0 md:p-8 flex items-start md:items-center justify-center overflow-y-auto" 
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedOrder(null); setIsEditing(false); } }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* NAVIGATION BUTTONS (DESKTOP) */}
          <div className="hidden md:flex fixed inset-x-4 top-1/2 -translate-y-1/2 justify-between items-center z-[70] pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }} className="size-16 bg-white/5 hover:bg-blue-600 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-110 active:scale-95 cursor-pointer"><ChevronLeft className="size-8" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }} className="size-16 bg-white/5 hover:bg-blue-600 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-110 active:scale-95 cursor-pointer"><ChevronRight className="size-8" /></button>
          </div>
          <div className="relative w-full max-w-5xl h-auto bg-card border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row md:max-h-[90vh] md:overflow-hidden">
             {/* CLOSE BUTTON (DESKTOP) */}
             <button 
               onClick={() => { setSelectedOrder(null); setIsEditing(false); }} 
               className="absolute top-6 right-6 size-10 bg-muted/50 hover:bg-blue-600 text-foreground hover:text-white flex items-center justify-center rounded-full transition-all z-[80] border border-border group active:scale-90 cursor-pointer hidden md:flex md:items-center md:justify-center"
             >
               <X className="size-5 group-hover:rotate-90 transition-transform duration-300" />
             </button>

             {/* CLOSE BUTTON (MOBILE) */}
             <button 
               onClick={() => { setSelectedOrder(null); setIsEditing(false); }} 
               className="absolute top-4 right-4 size-10 bg-black/60 backdrop-blur-md text-white flex items-center justify-center rounded-full z-[80] md:hidden border border-white/10"
             >
               <X className="size-5" />
             </button>
             <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
               <div className="w-full md:w-[48%] bg-muted/20 flex flex-col border-b md:border-b-0 md:border-r border-border p-4 md:p-6 shrink-0 md:overflow-y-auto custom-scrollbar">
                  <div className="relative aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden border border-border shadow-inner group">
                    {editingMixedImages.length > 0 ? (
                      <>
                        <FilePreview file={editingMixedImages[activeImageIndex] || editingMixedImages[0]} className="w-full h-full object-contain" />
                        {isEditing && (
                           <button 
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleRemoveImage(activeImageIndex); }}
                             className="absolute top-4 right-4 size-10 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-30 shadow-2xl hover:bg-black cursor-pointer border border-white/10"
                             title="Quitar esta imagen"
                           >
                             <Trash2 className="size-5" />
                           </button>
                        )}
                        {editingMixedImages.length > 1 && !isEditing && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + editingMixedImages.length) % editingMixedImages.length); }} 
                              className="absolute left-3 top-1/2 -translate-y-1/2 size-10 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-blue-600 hover:scale-110 active:scale-95 border border-white/10"
                            ><ChevronLeft className="size-6" /></button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % editingMixedImages.length); }} 
                              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 bg-black/50 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-blue-600 hover:scale-110 active:scale-95 border border-white/10"
                            ><ChevronRight className="size-6" /></button>
                          </>
                        )}
                      </>
                    ) : (<div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/10" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Multimedia</p></div>)}
                  </div>
                  {editingMixedImages.length > 0 && (
                      <div className="bg-background/20 mt-4 p-3 border border-border/50 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        {editingMixedImages.map((img: string | File, idx: number) => (
                          <div 
                            key={idx}
                            draggable={isEditing}
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropImage(idx)}
                            className="relative group shrink-0"
                          >
                            <button 
                              onClick={() => setActiveImageIndex(idx)} 
                              className={`size-16 shrink-0 border-2 transition-all ${isEditing ? 'cursor-move' : 'cursor-pointer'} ${activeImageIndex === idx ? 'border-blue-500 scale-105 shadow-2xl z-10' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                              <FilePreview file={img} className="w-full h-full object-cover" />
                            </button>
                            {idx === 0 && (
                              <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 z-20 shadow-lg">Portada</div>
                            )}
                            {isEditing && (
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }} 
                                className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg hover:bg-red-600 scale-0 group-hover:scale-100 cursor-pointer"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                  )}
                  {isEditing && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <label className={`border border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${isVerifyingImage ? 'border-blue-600 bg-blue-600/5 cursor-wait' : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'}`}>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} disabled={isVerifyingImage} />
                        {isVerifyingImage ? <Loader2 className="size-5 text-blue-600 animate-spin" /> : <ImagePlus className="size-5 text-blue-500 group-hover:scale-125 transition-transform" />}
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isVerifyingImage ? 'text-blue-600 animate-pulse' : 'text-blue-500'}`}>{isVerifyingImage ? 'Analizando' : 'Añadir'}</p>
                      </label>
                      <div className="relative group">
                        <button 
                          onClick={() => setImproveMenuOpen(!improveMenuOpen)}
                          disabled={aiLoading === "image" || !editingMixedImages[activeImageIndex]}
                          className="w-full border border-dashed border-amber-500/30 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 transition-all group disabled:opacity-50"
                        >
                           {aiLoading === "image" ? <Loader2 className="size-5 text-amber-500 animate-spin" /> : <Wand2 className="size-5 text-amber-500 group-hover:scale-125 transition-transform duration-500" />}
                           <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Mejorar IA</p>
                        </button>
                        
                        {improveMenuOpen && (
                          <div className="absolute bottom-full left-0 w-full mb-2 bg-card border border-border shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => handleImproveSelectedImage("CLEAN")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors border-b border-border cursor-pointer"><Sparkles className="size-3 text-blue-500" /> Fondo Blanco</button>
                            <button onClick={() => handleImproveSelectedImage("PERSPECTIVE")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors border-b border-border cursor-pointer"><ImagePlus className="size-3 text-amber-500" /> Perspectiva 3D</button>
                            <button onClick={() => handleImproveSelectedImage("STUDIO")} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase flex items-center gap-2 hover:bg-muted transition-colors cursor-pointer"><Bot className="size-3 text-green-500" /> Foto Profesional</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
               </div>
               <div className="flex-1 bg-card p-6 md:p-10 space-y-6 md:overflow-y-auto custom-scrollbar">
                 {!isEditing ? (
                   <div className="flex flex-col md:h-full md:overflow-hidden">
                      <div className="mb-8 pb-6 flex flex-wrap gap-3 border-b border-border shrink-0">
                         <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="flex-1 h-12 border border-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all cursor-pointer md:hidden">Cerrar</button>
                         <button onClick={() => { setEditForm({...selectedOrder, listingPrice: Number(selectedOrder.listingPrice?.$numberDecimal || selectedOrder.listingPrice) || 0}); setIsEditing(true); }} className="flex-1 h-12 border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer md:h-11 md:px-8 md:flex-none">Editar</button>
                         {selectedOrder.status === "LISTA" ? (
                           <button onClick={handleSendToBots} disabled={saving} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 cursor-pointer md:h-11 md:flex-none md:px-10">{saving ? <Loader2 className="size-4 animate-spin"/> : "🚀 Enviar"}</button>
                         ) : (
                           <Link href={`/generations/${selectedOrder.id}`} className="flex-[2] h-12 bg-muted text-foreground border border-border text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer md:h-11 md:flex-none md:px-10">
                             <ExternalLink className="size-4" /> Ver Ejecución
                           </Link>
                         )}
                         <div className="flex w-full md:w-auto gap-3 md:hidden">
                           <button onClick={() => handleNavigate('prev')} className="flex-1 md:w-12 h-12 border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90 cursor-pointer"><ChevronLeft className="size-5"/></button>
                           <button onClick={() => handleNavigate('next')} className="flex-1 md:w-12 h-12 border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90 cursor-pointer"><ChevronRight className="size-5"/></button>
                         </div>
                      </div>

                      <div className="flex-1 md:overflow-y-auto custom-scrollbar pr-2">
                        <div className="mb-6">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-3xl md:text-4xl font-black tracking-tighter text-blue-500 tabular-nums">
                              {selectedOrder.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(selectedOrder.listingPrice)}
                            </span>
                            <span className="h-[2px] flex-1 bg-blue-500/10" />
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none bg-blue-500/10 text-blue-500 border border-blue-500/20">{({ VEHICULO: "Vehículo", PROPIEDAD: "Propiedad", ARTICULO: "Artículo" } as any)[selectedOrder.listingType] || "Artículo"}</span>
                              <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none ${selectedOrder.status === 'GENERANDO' ? 'bg-blue-600 text-white' : 'bg-green-600/20 text-green-500 border border-green-500/20'}`}>{statusLabel[selectedOrder.status]}</span>
                            </div>
                          </div>

                          {selectedOrder.listingType === "VEHICULO" && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 border border-border/50 rounded-none mb-6">
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Año</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.vehicleYear || "N/A"}</p>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Marca</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.vehicleMake || "N/A"}</p>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Modelo</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.vehicleModel || "N/A"}</p>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Kilometraje</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.vehicleMileage ? `${selectedOrder.vehicleMileage} km` : "N/A"}</p>
                               </div>
                            </div>
                          )}

                          {selectedOrder.listingType === "PROPIEDAD" && (
                            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 border border-border/50 rounded-none mb-6">
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Hab.</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.propRooms || "N/A"}</p>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Baños</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.propBathrooms || "N/A"}</p>
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Superficie</h4>
                                  <p className="text-xs font-black uppercase">{selectedOrder.propArea ? `${selectedOrder.propArea} m²` : "N/A"}</p>
                               </div>
                            </div>
                          )}
                          <h2 className="text-xl md:text-2xl font-bold leading-tight uppercase tracking-tight">{selectedOrder.listingTitle || selectedOrder.orderName}</h2>
                          <div className="mt-2 flex items-center gap-3">
                             <div className="flex items-center gap-1.5">
                               <div className="size-5 bg-blue-500/10 flex items-center justify-center rounded">
                                 <Bot className="size-3 text-blue-500" />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                 {selectedOrder.quantity || 1} Bots Asignados
                               </span>
                             </div>
                             {(() => {
                               const mainGen = selectedOrder.genMarketplaces?.find((g: any) => g.device?.redesSociales);
                               if (!mainGen?.device?.redesSociales) return null;
                               const wa = (mainGen.device.redesSociales as any[]).find((r: any) => r.red_social === "whatsapp");
                               const phone = wa?.telefono_asociado || wa?.user;
                               if (!phone) return null;
                               return (
                                 <span className="text-[11px] font-bold text-emerald-500 tabular-nums">
                                   📲 {phone}
                                 </span>
                               );
                             })()}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Descripción</h4><p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">{selectedOrder.listingDescription || "Sin descripción."}</p></div>
                          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                             <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Categoría</h4><p className="text-xs font-bold uppercase text-blue-500">{selectedOrder.listingCategory?.replace(/_/g, ' ')}</p></div>
                             <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Condición</h4><p className="text-xs font-bold uppercase">{selectedOrder.listingCondition?.replace(/_/g, ' ')}</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                      <SecurityWarning visible={editingMixedImages.length > 0} />
                      <div className="mb-4 flex items-center gap-3 shrink-0"><div className="h-6 w-1.5 bg-blue-500" /><h3 className="text-lg font-black uppercase tracking-widest text-foreground">Editar {({ VEHICULO: "Vehículo", PROPIEDAD: "Propiedad", ARTICULO: "Artículo" } as any)[selectedOrder.listingType] || "Artículo"}</h3></div>
                      
                      {/* BOT BANNER */}
                      {availableBots.length > 0 && (() => {
                         const bot = availableBots[0];
                         if (!bot?.redesSociales) return null;
                         const wa = (bot.redesSociales as any[]).find((r:any) => r.red_social === 'whatsapp');
                         const fb = (bot.redesSociales as any[]).find((r:any) => r.red_social === 'facebook');
                         if (!wa) return null;
                         return (
                           <div className="p-4 bg-blue-500/5 border border-blue-500/20 w-full mb-4 relative overflow-hidden shrink-0">
                             <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                             <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-3 flex items-center gap-2">
                               <Bot className="size-3.5" /> Bot Principal Sugerido
                             </p>
                             <div className="flex flex-wrap items-center gap-3">
                               <span className="text-[11px] font-black text-foreground uppercase">{bot.serial}</span>
                               {bot.personName && <span className="text-[9px] text-muted-foreground uppercase">{bot.personName}</span>}
                               <div className="h-3 w-px bg-border" />
                               <div className="flex items-center gap-1.5">
                                 <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 border border-emerald-500/20">WA</span>
                                 <span className="text-[11px] font-mono font-black text-foreground">{wa.telefono_asociado || wa.user}</span>
                               </div>
                               {fb && (
                                 <div className="flex items-center gap-1.5">
                                   <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 border border-blue-500/20">FB</span>
                                   <span className="text-[10px] font-bold text-foreground opacity-80">{fb.user}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         );
                       })()}

                      <div className="flex-1 md:overflow-y-auto custom-scrollbar pr-2">
                        <div className="space-y-5">
                          <div className="space-y-1.5">
                             <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Título de la publicación</Label>
                               <button onClick={handleImproveTitle} disabled={aiLoading === "title" || !editForm.listingTitle} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50 cursor-pointer">
                                 {aiLoading === "title" ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />} Mejorar con IA
                               </button>
                             </div>
                             <Input className="h-12 bg-muted/20 border-border text-xs font-bold focus:ring-2 focus:ring-blue-500" name="listingTitle" value={editForm.listingTitle || ""} onChange={handleEditChange} placeholder="Escribe el nombre..." />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1.5 flex flex-col">
                               <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Monto y Divisa</Label>
                               <div className="flex items-stretch border border-border bg-muted/20 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300 w-full overflow-hidden h-12 rounded-none">
                                 <Input 
                                   type="number" 
                                   className="h-full flex-1 border-none bg-transparent text-sm font-black text-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 placeholder:text-muted-foreground/30" 
                                   name="listingPrice" 
                                   value={editForm.listingPrice || ""} 
                                   onChange={handleEditChange} 
                                 />
                                 <div className="border-l border-border bg-muted/30 px-1 flex items-center shrink-0">
                                    <Select value={editForm.listingCurrency || "BOLIVIANO"} onValueChange={v => setEditForm({...editForm, listingCurrency: v})}>
                                      <SelectTrigger className="w-14 h-full border-none bg-transparent text-[10px] font-black uppercase shadow-none focus:ring-0 cursor-pointer flex flex-row-reverse gap-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] border-border bg-card">
                                        <SelectItem value="BOLIVIANO" className="text-[10px] font-black uppercase cursor-pointer">BOL</SelectItem>
                                        <SelectItem value="DOLAR" className="text-[10px] font-black uppercase cursor-pointer">USD</SelectItem>
                                      </SelectContent>
                                    </Select>
                                 </div>
                               </div>
                             </div>

                             <div className="md:col-span-2 space-y-4">
                               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border p-4 mb-4 bg-muted/5">
                                  <div className="flex items-center gap-3">
                                     <div className="size-8 bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Bot className="size-4 text-blue-500" /></div>
                                     <div className="flex flex-col">
                                       <Label className="text-[12px] font-black uppercase tracking-widest">Cantidad de Bots</Label>
                                       <span className="text-[8px] font-bold text-muted-foreground uppercase">Asignación Automática</span>
                                     </div>
                                  </div>
                                  <Input 
                                    type="number" 
                                    className="h-10 w-24 bg-muted/20 border-2 border-blue-600/20 text-lg font-black text-center rounded-none" 
                                    value={editForm.quantity} 
                                    onChange={handleQuantityChange}
                                    min={1}
                                  />
                               </div>
                             </div>
                           </div>
                          {editForm.listingType === "VEHICULO" && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Año</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleYear" value={editForm.vehicleYear || ""} onChange={handleEditChange} placeholder="2024" /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Kilometraje (km)</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleMileage" value={editForm.vehicleMileage || ""} onChange={handleEditChange} placeholder="0" /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Marca</Label><Input className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleMake" value={editForm.vehicleMake || ""} onChange={handleEditChange} placeholder="Toyota" /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Modelo</Label><Input className="h-12 bg-muted/20 border-border text-xs font-bold" name="vehicleModel" value={editForm.vehicleModel || ""} onChange={handleEditChange} placeholder="Hilux" /></div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Tipo de Vehículo</Label>
                                <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                                  <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <SelectValue placeholder="Seleccionar tipo..." />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100] cursor-pointer">
                                    {["AUTOS_Y_CAMIONETAS", "MOTOS", "STATION_WAGON", "SUB_BUS_Y_MINIBUS", "CAMIONES_Y_MAQUINARIA"].map(c => (
                                      <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase cursor-pointer">{c.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          {editForm.listingType === "PROPIEDAD" && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Hab.</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propRooms" value={editForm.propRooms || ""} onChange={handleEditChange} /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Baños</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propBathrooms" value={editForm.propBathrooms || ""} onChange={handleEditChange} /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">m²</Label><Input type="number" className="h-12 bg-muted/20 border-border text-xs font-bold" name="propArea" value={editForm.propArea || ""} onChange={handleEditChange} /></div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Tipo de Propiedad</Label>
                                <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                                  <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <SelectValue placeholder="Seleccionar tipo..." />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100] cursor-pointer">
                                    {["ALQUILER_PROPIEDADES", "VENTA_PROPIEDADES", "TERRENOS_Y_LOTES", "LOCALES_Y_OFFICINAS"].map(c => (
                                      <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase cursor-pointer">{c.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          {editForm.listingType === "ARTICULO" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Categoría</Label>
                                <Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}>
                                  <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="z-[100]">
                                    {["VARIOS", "ELECTRONICA", "ROPA_Y_ACCESORIOS", "HOGAR_Y_JARDIN", "JUGUETES_Y_JUEGOS", "DEPORTES", "INSTRUMENTOS_MUSICALES", "MUEBLES", "ELECTRODOMESTICOS"].map(c => (
                                      <SelectItem key={c} value={c} className="text-[10px] font-bold uppercase cursor-pointer">{c.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Condición</Label>
                                <Select value={editForm.listingCondition} onValueChange={v => setEditForm({...editForm, listingCondition: v})}>
                                  <SelectTrigger className="w-full h-12 bg-muted/20 border border-border text-[10px] font-bold uppercase rounded-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="NUEVO" className="cursor-pointer">NUEVO</SelectItem>
                                    <SelectItem value="USADO_COMO_NUEVO" className="cursor-pointer">COMO NUEVO</SelectItem>
                                    <SelectItem value="USADO_BUENO" className="cursor-pointer">BUENO</SelectItem>
                                    <SelectItem value="USADO_REGULAR" className="cursor-pointer">REGULAR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          <div className="space-y-1.5">
                             <div className="flex items-center justify-between">
                               <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Descripción Detallada</Label>
                               <button onClick={handleImproveDescription} disabled={aiLoading === "description"} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50">
                                  {aiLoading === "description" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Mejorar con IA
                                </button>
                              </div>
                              <Textarea className="min-h-[140px] bg-muted/20 border-border text-xs leading-relaxed resize-none p-4 focus:ring-2 focus:ring-blue-500" name="listingDescription" value={editForm.listingDescription || ""} onChange={handleEditChange} placeholder="Descripción detallada..." />
                           </div>
                          <div className="mt-auto pt-6 flex gap-3 border-t border-border bg-card">
                            <button onClick={() => setIsEditing(false)} className="flex-1 h-12 text-[10px] font-black uppercase tracking-[0.2em] border border-border hover:bg-muted transition-all cursor-pointer">Cancelar</button>
                            <button disabled={saving} onClick={handleSave} className="flex-[2] h-12 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/20 active:scale-95">{saving ? <Loader2 className="size-4 animate-spin"/> : "GUARDAR CAMBIOS"}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}

      {/* CONFIRM DISPATCH MODAL */}
      {isConfirmingDispatch && selectedOrder && (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
            onClick={() => setIsConfirmingDispatch(false)}
          >
            <div 
              className="bg-card border border-white/10 w-full max-w-lg shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="size-20 bg-blue-600/10 flex items-center justify-center border border-blue-500/20 relative">
                     <Bot className="size-10 text-blue-500" />
                     <div className="absolute -top-1 -right-1 size-4 bg-blue-600 animate-ping rounded-full opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Confirmar Envío</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                      Una vez enviado a los bots, la publicación entrará en proceso automático y <span className="text-amber-500 font-bold">no podrá ser editada</span>.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 border border-border/50 p-4 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="size-16 bg-black/20 border border-border shrink-0 overflow-hidden">
                        {selectedOrder.imageUrls?.[0] ? (
                          <img src={selectedOrder.imageUrls[0]} alt="" className="size-full object-cover grayscale-[0.5]" />
                        ) : (
                          <div className="size-full flex items-center justify-center"><ShoppingBag className="size-6 text-muted-foreground/20" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-[11px] font-black uppercase text-foreground truncate">{selectedOrder.listingTitle || selectedOrder.orderName}</h4>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-blue-500">
                             {selectedOrder.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(selectedOrder.listingPrice)}
                           </span>
                           <span className="text-[8px] font-bold text-muted-foreground/60 uppercase bg-muted px-2 py-0.5">{selectedOrder.listingCategory?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pb-2">
                      <div className="bg-background/40 p-3 flex flex-col gap-1 border-l-2 border-blue-600">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-widest">Bots Asignados</span>
                        <span className="text-sm font-black text-foreground">{selectedOrder.quantity || 1} Unidades</span>
                      </div>
                      <div className="bg-background/40 p-3 flex flex-col gap-1 border-l-2 border-amber-600">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-widest">Red Social</span>
                        <span className="text-sm font-black text-foreground uppercase">{selectedOrder.socialNetwork}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={executeDispatch} 
                    disabled={saving}
                    className="h-14 w-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {saving ? <Loader2 className="size-5 animate-spin" /> : "🚀 Iniciar Distribución Automática"}
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDispatch(false)} 
                    disabled={saving}
                    className="h-12 w-full border border-border hover:bg-muted text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Seguir Editando
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

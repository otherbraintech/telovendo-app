"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, ShoppingBag, Loader2, ImagePlus, X, MoreVertical, Copy, Trash2, Edit, ChevronLeft, ChevronRight, Wand2, Sparkles, Bot, ExternalLink, Box, Car, Home, PenLine, Package, CheckCircle2, Clock, AlertCircle, ArrowRight, GripVertical, Plus, ChevronDown } from "lucide-react"
import { useEffect, useState, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { getOrdersByProject, updateBotOrder, sendOrderToBots, createBotOrder, cancelBotOrder, deleteBotOrder } from "@/lib/actions/orders"
import { getProjects } from "@/lib/actions/projects"
import { improveTitle, improveDescription, generateProductImage, improveProductImage, analyzeVehicleImage, analyzeImageSecurity, type ImproveType } from "@/lib/actions/ai"
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
const phoneRegex = /(?:\+?\d{1,3})?(?:[ -]?\(?\d{2,3}\)?[ -]?\d{3,4}[ -]?\d{3,4}|\d{7,10})/g;
const FORMAT_CLEAN_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}*]/gu;

const validateTextContent = (text: string) => {
  if (phoneRegex.test(text)) {
    return { valid: false, reason: "No se permiten números de teléfono en el título o descripción para evitar bloqueos del marketplace." };
  }
  return { valid: true };
};

const SecurityWarning = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 p-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-500 w-full">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1">Aviso de Seguridad</p>
          <p className="text-[9px] text-amber-500/80 font-bold uppercase leading-tight">Prohibido subir imágenes con números de teléfono o códigos QR. No incluyas datos de contacto en el título o descripción.</p>
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
  
  // Sync selected order to breadcrumbs
  useEffect(() => {
    setActiveOrderName(selectedOrder ? (selectedOrder.listingTitle || selectedOrder.orderName) : null)
  }, [selectedOrder, setActiveOrderName])

  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState<"CHOICE" | "FORM">("CHOICE")
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([])
  const [filter, setFilter] = useState("TODAS")
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
  }, [selectedProjectId]);

  const filteredOrders = useMemo(() => 
    filter === "TODAS" ? orders : orders.filter(o => o.status === filter),
    [filter, orders]
  );

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

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      setIsVerifyingImage(true);
      toast.info("Verificando seguridad de las imágenes...");

      try {
        for (const file of files) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          const security = await analyzeImageSecurity(base64);
          if (!security.safe) {
             toast.error("Imagen rechazada", {
               description: security.reason || "Se detectaron datos de contacto o QR prohibidos.",
               duration: 6000
             });
             setIsVerifyingImage(false);
             return; // Detener carga si una imagen es rechazada
          }
        }

        const oldImagesLength = editingMixedImages.length;
        setEditSelectedFiles(prev => [...prev, ...files]);
        
        // Forzar que el visor muestre la primera de las nuevas imágenes cargadas
        setActiveImageIndex(oldImagesLength);
        
        // Si es un vehículo y no hay datos, intentar analizar con IA
        if (editForm.listingType === "VEHICULO" && !editForm.listingTitle && files.length > 0) {
          handleAutoDetectVehicle(files[0]);
        }
      } catch (err) {
        toast.error("Error validando imagen");
      } finally {
        setIsVerifyingImage(false);
      }
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
    
    setEditForm({ ...editForm, [e.target.name]: value })
  }

  const handleImproveTitle = async () => {
    if (!editForm.listingTitle) return;
    try {
      setAiLoading("title")
      let improved = await improveTitle(editForm.listingTitle, editForm.listingCategory)
      
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
    } finally {
      setAiLoading(null)
    }
  }

  const handleImproveDescription = async () => {
    try {
      setAiLoading("description")
      let improved = await improveDescription(
        editForm.listingTitle || "",
        editForm.listingDescription || "",
        editForm.listingCategory
      )
      
      // Sanitizar resultado de IA
      improved = improved.replace(FORMAT_CLEAN_REGEX, "");

      const val = validateTextContent(improved);
      if (!val.valid) {
        toast.error("IA generó contenido prohibido", { description: val.reason });
        return;
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
      const url = await generateProductImage(editForm.listingTitle, editForm.listingDescription || "")
      
      // Validar seguridad de la imagen generada
      setIsVerifyingImage(true);
      const security = await analyzeImageSecurity(url);
      if (!security.safe) {
        toast.error("Imagen generada rechazada", { 
          description: security.reason || "La IA incluyó accidentalmente texto o QR prohibido. Intenta nuevamente.",
          duration: 6000
        });
        setIsVerifyingImage(false);
        return;
      }
      setIsVerifyingImage(false);

      setEditForm((prev: any) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), url]
      }))
      setActiveImageIndex((editForm.imageUrls?.length || 0) + (editSelectedFiles.length || 0))
    } catch (error) {
      console.error(error)
      alert("Error generando imagen")
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

      const improvedUrl = await improveProductImage(
        imageSource,
        editForm.listingTitle || "",
        editForm.listingDescription || "",
        type
      );

      // Validar seguridad de la imagen mejorada
      setIsVerifyingImage(true);
      const security = await analyzeImageSecurity(improvedUrl);
      if (!security.safe) {
        toast.error("Mejora rechazada", { 
          description: security.reason || "La IA añadió accidentalmente texto o QR prohibido. Intenta con otro estilo.",
          duration: 6000
        });
        setIsVerifyingImage(false);
        return;
      }
      setIsVerifyingImage(false);

      setEditForm((prev: any) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), improvedUrl],
      }));
      setActiveImageIndex(
        (editForm.imageUrls?.length || 0) + (editSelectedFiles.length || 0)
      );
    } catch (error) {
      console.error(error);
      alert("Error mejorando la imagen");
    } finally {
      setAiLoading(null);
    }
  }

  const [draggedBotIndex, setDraggedBotIndex] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    setDraggedImageIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropImage = (idx: number) => {
    if (draggedImageIndex === null) return;
    
    // Obtenemos el array actual de imágenes mezcladas
    const currentImages = [...editingMixedImages];
    const draggedItem = currentImages[draggedImageIndex];
    
    // Reordenamos
    currentImages.splice(draggedImageIndex, 1);
    currentImages.splice(idx, 0, draggedItem);
    
    // Clasificamos de nuevo en URLs y Archivos para el estado
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

  const handleDragBotStart = (idx: number) => {
    setDraggedBotIndex(idx);
  };

  const handleDropBot = (idx: number) => {
    if (draggedBotIndex === null) return;
    
    const current = [...(editForm.selectedDeviceIds || [])];
    const item = current[draggedBotIndex];
    current.splice(draggedBotIndex, 1);
    current.splice(idx, 0, item);
    
    setEditForm({ ...editForm, selectedDeviceIds: current });
    setDraggedBotIndex(null);
  };

  const setAsPrimaryBot = (botId: string) => {
    const current = [...(editForm.selectedDeviceIds || [])];
    if (current[0] === botId) return;
    const filtered = current.filter(id => id !== botId);
    setEditForm({ ...editForm, selectedDeviceIds: [botId, ...filtered] });
    toast.success("Bot Principal actualizado", { position: "bottom-center" });
  };

  const toggleBotSelection = (botId: string) => {
    const current = editForm.selectedDeviceIds || [];
    const updated = current.includes(botId) 
      ? current.filter((id: string) => id !== botId)
      : [...current, botId];
    
    setEditForm({ 
      ...editForm, 
      selectedDeviceIds: updated,
      quantity: updated.length
    });
  };

  const handleRandomSelect = (count: number) => {
    const available = allDevices.filter(d => d.status === 'LIBRE');
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map(d => d.id);
    
    setEditForm({
      ...editForm,
      selectedDeviceIds: selected,
      quantity: selected.length
    });
  };

  const syncBotsWithQuantity = (count: number, current: string[]) => {
    if (count === current.length) return current;
    if (count < current.length) return current.slice(0, count);
    
    // Necesitamos añadir más bots
    const available = allDevices.filter(d => d.status === 'LIBRE' && !current.includes(d.id));
    const needed = count - current.length;
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const added = shuffled.slice(0, needed).map(d => d.id);
    
    if (added.length < needed) {
      toast.warning(`Solo hay ${current.length + added.length} bots disponibles.`);
    }
    
    return [...current, ...added];
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const currentSelected = editForm.selectedDeviceIds || [];
    const next = syncBotsWithQuantity(val, currentSelected);
    
    setEditForm({ 
      ...editForm, 
      quantity: next.length, 
      selectedDeviceIds: next 
    });
  };

  const handleSave = async () => {
    // Validar texto
    const titleVal = validateTextContent(editForm.listingTitle || "");
    const descVal = validateTextContent(editForm.listingDescription || "");
    if (!titleVal.valid) return toast.error(titleVal.reason);
    if (descVal.valid === false) return toast.error(descVal.reason);

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
        listingDescription: editForm.listingDescription,
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
        listingDescription: editForm.listingDescription || "",
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
    try {
      setSaving(true)
      const updated = await sendOrderToBots(selectedOrder.id)
      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
      setSelectedOrder(updated)
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
              className="h-10 px-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              + Nueva Publicación
            </button>
            <div className="relative group flex-1 min-w-[140px] sm:min-w-0 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Buscar..." className="w-full sm:w-44 lg:w-56 bg-card border border-border px-4 py-2.5 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-foreground" />
            </div>
            <div className="relative group flex-1 min-w-[140px] sm:min-w-0 sm:flex-none">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-10 w-full sm:w-44 bg-card border border-border pl-9 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-1 focus:ring-blue-500 rounded-none hover:bg-muted/50 transition-all">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <SelectValue placeholder="FILTRAR POR ESTADO" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start auto-rows-max">
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
              <div className="p-4 flex flex-col flex-1 gap-2 bg-gradient-to-b from-card to-muted/10">
                <div className="text-xl font-black text-blue-500 tabular-nums tracking-tighter">
                  {order.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(order.listingPrice)}
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-none uppercase tracking-tight">{order.listingTitle || order.orderName}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed opacity-70">{order.listingDescription || "Publicación sin descripción detallada."}</p>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                   <div className="flex items-center gap-2">
                      <div className="size-5 bg-blue-500/10 flex items-center justify-center rounded-none border border-blue-500/20">
                        <Bot className="size-3 text-blue-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{order.quantity || 1} Bots</span>
                   </div>
                  {order.status === "LISTA" ? (
                    <button onClick={(e) => inlineSendToBots(e, order.id)} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95">
                      {saving ? <Loader2 className="size-3 animate-spin"/> : "🚀 Enviar"}
                    </button>
                  ) : (
                    <Link href={`/generations/${order.id}`} onClick={(e) => e.stopPropagation()} className="bg-muted hover:bg-muted/80 text-foreground border border-border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-sm active:scale-95">
                      <ExternalLink className="size-3" /> Ver Ejecución
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
          <div className="relative w-full max-w-5xl h-auto bg-card border border-white/5 shadow-[0_0_80px_rgba(37,99,235,0.1)] animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row md:max-h-[90vh] md:overflow-hidden">
             <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 size-10 bg-white/5 flex items-center justify-center hover:bg-red-500 text-white transition-all z-[70] border border-white/10 group active:scale-90 cursor-pointer"><X className="size-5 group-hover:rotate-90 transition-transform duration-300" /></button>
             
             {creationStep === "CHOICE" ? (
               <div className="flex-1 p-8 md:p-16 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-3 mb-4"><div className="h-6 w-1.5 bg-blue-500" /><h3 className="text-xl font-black uppercase tracking-[0.3em] text-foreground">Seleccionar Tipo</h3></div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-12 opacity-60">¿Qué tipo de publicación deseas crear hoy?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                    <button onClick={() => { 
                      const q = 1;
                      const nextBots = syncBotsWithQuantity(q, []);
                      setEditForm({...editForm, listingType: "ARTICULO", listingCategory: "VARIOS", quantity: nextBots.length, selectedDeviceIds: nextBots}); 
                      setCreationStep("FORM"); 
                    }} className="group p-6 md:p-8 border border-border bg-muted/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center flex flex-col items-center gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Box className="size-16 translate-x-4 -translate-y-4" /></div>
                      <div className="size-12 md:size-16 bg-blue-500/10 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform"><Box className="size-6 md:size-8 text-blue-500" /></div>
                      <div className="space-y-1 z-10"><h4 className="text-xs font-black uppercase tracking-widest">Artículos</h4><p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-medium">Ropa, Electrónica, Hogar...</p></div>
                    </button>
                    <button onClick={() => { 
                      const q = 1;
                      const nextBots = syncBotsWithQuantity(q, []);
                      setEditForm({...editForm, listingType: "VEHICULO", listingCategory: "AUTOS_Y_CAMIONETAS", quantity: nextBots.length, selectedDeviceIds: nextBots}); 
                      setCreationStep("FORM"); 
                    }} className="group p-6 md:p-8 border border-border bg-muted/20 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center flex flex-col items-center gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Car className="size-16 translate-x-4 -translate-y-4" /></div>
                      <div className="size-12 md:size-16 bg-amber-500/10 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform"><Car className="size-6 md:size-8 text-amber-500" /></div>
                      <div className="space-y-1 z-10"><h4 className="text-xs font-black uppercase tracking-widest">Vehículos</h4><p className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-medium">Autos, Motos, Camiones...</p></div>
                    </button>
                    <button onClick={() => { 
                      const q = 1;
                      const nextBots = syncBotsWithQuantity(q, []);
                      setEditForm({...editForm, listingType: "PROPIEDAD", listingCategory: "ALQUILER_PROPIEDADES", quantity: nextBots.length, selectedDeviceIds: nextBots}); 
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
                        <FilePreview file={editingMixedImages[activeImageIndex] || editingMixedImages[0]} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/5 animate-pulse" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Subir Imagen Principal</p></div>
                      )}
                    </div>
                    {editingMixedImages.length > 1 && (
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
                       Nueva Publicación: {editForm.listingType === "VEHICULO" ? "Vehículo" : editForm.listingType === "PROPIEDAD" ? "Propiedad" : "Artículo"}
                     </h3>
                   </div>
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
                           <Collapsible defaultOpen={true}>
                             <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-3">
                              <div className="flex items-center gap-4">
                                <div className="size-10 bg-blue-600/10 flex items-center justify-center border border-blue-500/20"><Bot className="size-5 text-blue-500" /></div>
                                <div className="flex flex-col">
                                   <Label className="text-[14px] font-black uppercase tracking-widest text-foreground">Bots</Label>
                                   <div className="flex items-center gap-1.5">
                                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Sistema Activo</span>
                                   </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                 <div className="relative group">
                                   <Input 
                                     type="number" 
                                     className="h-10 w-20 bg-muted/20 border-2 border-blue-600/30 text-lg font-black text-center focus:ring-0 focus:border-blue-500 transition-all rounded-none" 
                                     value={editForm.quantity} 
                                     onChange={handleQuantityChange}
                                     min={0}
                                   />
                                   <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white size-3.5 flex items-center justify-center text-[7px] font-black rounded-none shadow-lg">#</div>
                                 </div>
                                 <div className="h-8 w-px bg-border mx-1" />
                                 <button 
                                   onClick={() => setIsBotSelectorOpen(true)}
                                   className="h-10 px-4 bg-muted/20 hover:bg-muted text-[9px] font-black uppercase tracking-widest border border-border flex items-center gap-2 transition-all active:scale-95"
                                 >
                                   Personalizar <Filter className="size-3" />
                                 </button>
                                 <CollapsibleTrigger asChild>
                                   <button className="h-10 px-3 bg-muted/20 hover:bg-muted border border-border transition-all group flex items-center gap-2">
                                     <span className="text-[9px] font-black uppercase tracking-widest">Ver</span>
                                     <ChevronDown className="size-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                                   </button>
                                 </CollapsibleTrigger>
                              </div>
                           </div>

                             <CollapsibleContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                 <AnimatePresence mode="popLayout">
                                   {(editForm.selectedDeviceIds || []).map((botId: string, idx: number) => {
                                     const bot = allDevices.find(d => d.id === botId);
                                     if (!bot) return null;
                                     return (
                                       <motion.div 
                                         layout
                                         key={botId}
                                         initial={{ opacity: 0, scale: 0.8 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         exit={{ opacity: 0, scale: 0.8 }}
                                         transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                         draggable
                                         onDragStart={() => handleDragBotStart(idx)}
                                         onDragOver={handleDragOver}
                                         onDrop={() => handleDropBot(idx)}
                                         className={`relative p-2 border flex flex-col justify-between transition-all cursor-move group h-24 ${idx === 0 ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30' : 'bg-muted/5 border-border hover:bg-muted/10'}`}
                                       >
                                          <div className="flex items-start justify-between">
                                             <div className="flex items-center gap-1">
                                                <span className="text-[7px] font-black text-muted-foreground/40 group-hover:text-amber-500">#{idx + 1}</span>
                                                {idx === 0 && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                             </div>
                                          </div>
                                          <div className="flex flex-col">
                                             <span className={`text-[8px] font-black uppercase truncate ${idx === 0 ? 'text-amber-600' : 'text-foreground'}`}>{bot.label || bot.model || "Bot"}</span>
                                             <span className="text-[7px] font-bold text-muted-foreground truncate opacity-60 mt-0.5">{bot.serial}</span>
                                          </div>
                                          {idx === 0 && (
                                            <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-amber-600 text-white text-[6px] font-black uppercase px-2 py-0.5 shadow-lg animate-in zoom-in-50 duration-300">
                                              <Sparkles className="size-2" /> Principal
                                            </div>
                                          )}
                                       </motion.div>
                                     );
                                   })}
                                 </AnimatePresence>
                                 
                                 {(editForm.selectedDeviceIds || []).length === 0 && (
                                   <div className="col-span-full border border-dashed border-border/50 bg-muted/5 flex items-center justify-center p-6 text-center opacity-30">
                                     <p className="text-[8px] font-black uppercase tracking-[0.2em]">Automático ({editForm.quantity} bots)</p>
                                   </div>
                                 )}
                               </div>
                             </CollapsibleContent>
                           </Collapsible>

                           {/* SELECTOR COMPACTO */}
                           {isBotSelectorOpen && (
                             <div className="absolute inset-0 bg-background z-[200] flex flex-col animate-in fade-in zoom-in-95 duration-300">
                               <div className="flex items-center justify-between p-4 border-b border-border bg-card shrink-0 shadow-sm">
                                  <div className="flex flex-col gap-0.5">
                                     <div className="flex items-center gap-2">
                                       <Bot className="size-4 text-blue-500" />
                                       <p className="text-[10px] font-black uppercase tracking-widest">Orquestador de Dispositivos</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter bg-muted px-1.5 py-0.5 border border-border">
                                          {editForm.selectedDeviceIds?.length || 0} Seleccionados
                                        </span>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                                          de {allDevices.filter(d => d.status === 'LIBRE' || (editForm.selectedDeviceIds || []).includes(d.id)).length} Disponibles
                                        </span>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => setIsBotSelectorOpen(false)}
                                    className="px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                  >
                                    Cerrar
                                  </button>
                               </div>

                               <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-muted/5">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                   {allDevices.map((bot, bIdx) => {
                                     const isSelected = (editForm.selectedDeviceIds || []).includes(bot.id);
                                     const isAvailable = bot.status === 'LIBRE';
                                     return (
                                       <button
                                         key={bot.id}
                                         onClick={() => toggleBotSelection(bot.id)}
                                         disabled={!isAvailable && !isSelected}
                                         className={`flex items-center gap-3 p-3 border transition-all relative overflow-hidden group ${
                                           isSelected
                                             ? 'border-blue-600 bg-blue-600/10 ring-1 ring-blue-600/30'
                                             : isAvailable 
                                               ? 'border-border bg-white/5 hover:border-blue-500/30 hover:bg-muted/10' 
                                               : 'border-border/10 opacity-30 cursor-not-allowed bg-black/5'
                                         }`}
                                       >
                                         <div className={`size-8 flex items-center justify-center shrink-0 border ${isSelected ? 'border-blue-500/40 bg-blue-500/10' : 'border-border bg-muted/20'}`}>
                                            {isSelected ? <CheckCircle2 className="size-4 text-blue-500" /> : <Bot className={`size-4 ${isAvailable ? 'text-muted-foreground/40' : 'text-red-500/20'}`} />}
                                         </div>
                                         <div className="flex flex-col items-start min-w-0 flex-1">
                                            <span className={`text-[9px] font-black uppercase truncate w-full tracking-tight ${isSelected ? 'text-blue-500' : ''}`}>{bot.label || bot.model || "Terminal Bot"}</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className={`size-1.5 rounded-full ${isAvailable ? 'bg-green-500' : isSelected ? 'bg-blue-500' : 'bg-red-500'}`} />
                                              <span className="text-[7px] text-muted-foreground/60 font-mono truncate uppercase">{bot.serial}</span>
                                            </div>
                                         </div>
                                         <span className="absolute top-1 right-1 text-[7px] font-bold text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors">#{bIdx + 1}</span>
                                       </button>
                                     );
                                   })}
                                 </div>
                               </div>
                               
                               <div className="p-4 border-t border-border bg-card flex items-center justify-between shrink-0">
                                  <button onClick={() => setEditForm({...editForm, selectedDeviceIds: [], quantity: 0})} className="text-[8px] font-black uppercase text-red-500 hover:bg-red-500/5 px-3 py-1.5 transition-colors border border-red-500/10">Vaciar</button>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => setIsBotSelectorOpen(false)} className="px-6 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-600/20">Confirmar</button>
                                  </div>
                               </div>
                             </div>
                           )}
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
                         <Textarea className="min-h-[140px] bg-muted/20 border-border text-xs leading-relaxed resize-none p-4 focus:ring-2 focus:ring-blue-500" name="listingDescription" value={editForm.listingDescription || ""} onChange={handleEditChange} placeholder="Describe detalladamente el producto..." />
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
                  <div className="relative aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden border border-border shadow-inner">
                    {editingMixedImages.length > 0 ? (<FilePreview file={editingMixedImages[activeImageIndex] || editingMixedImages[0]} className="w-full h-full object-contain" />) : (<div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/10" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Multimedia</p></div>)}
                  </div>
                  {editingMixedImages.length > 1 && (
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
                                onClick={(e) => { e.stopPropagation(); const target = editingMixedImages[idx]; if (typeof target === 'string') { setEditForm({ ...editForm, imageUrls: editForm.imageUrls.filter((url: string) => url !== target) }); } else { setEditSelectedFiles(prev => prev.filter(f => f !== target)); } setActiveImageIndex(0); }} 
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white size-5 flex items-center justify-center rounded-none z-20 shadow-xl active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
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
                          <div className="mt-2 flex items-center gap-1.5">
                             <div className="size-5 bg-blue-500/10 flex items-center justify-center rounded">
                               <Bot className="size-3 text-blue-500" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                               {selectedOrder.quantity || 1} Bots Asignados
                             </span>
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
                               <Collapsible defaultOpen={true}>
                                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-3 mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="size-8 bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Bot className="size-4 text-blue-500" /></div>
                                       <Label className="text-[12px] font-black uppercase tracking-widest">Bots</Label>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                       <Input 
                                         type="number" 
                                         className="h-9 w-16 bg-muted/20 border-2 border-blue-600/20 text-md font-black text-center rounded-none" 
                                         value={editForm.quantity} 
                                         onChange={handleQuantityChange}
                                         min={0}
                                       />
                                       <button 
                                         onClick={() => setIsBotSelectorOpen(true)}
                                         className="h-9 px-3 border border-border bg-muted/10 hover:bg-muted text-[8px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all"
                                       >
                                         Personalizar <Filter className="size-3" />
                                       </button>
                                       <CollapsibleTrigger asChild>
                                         <button className="h-9 px-2 border border-border bg-muted/10 hover:bg-muted transition-all group">
                                           <ChevronDown className="size-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                                         </button>
                                       </CollapsibleTrigger>
                                    </div>
                                 </div>

                                 <CollapsibleContent className="animate-in fade-in slide-in-from-top-1 duration-300">
                                   <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                     <AnimatePresence mode="popLayout">
                                       {(editForm.selectedDeviceIds || []).map((botId: string, idx: number) => {
                                         const bot = allDevices.find(d => d.id === botId);
                                         if (!bot) return null;
                                         return (
                                           <motion.div 
                                             layout
                                             key={botId}
                                             initial={{ opacity: 0, scale: 0.8 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             exit={{ opacity: 0, scale: 0.8 }}
                                             transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                             draggable
                                             onDragStart={() => handleDragBotStart(idx)}
                                             onDragOver={handleDragOver}
                                             onDrop={() => handleDropBot(idx)}
                                             className={`relative p-2 border flex flex-col justify-between transition-all cursor-move group h-20 ${idx === 0 ? 'border-amber-500 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20' : 'bg-muted/5 border-border hover:bg-muted/10'}`}
                                           >
                                              <div className="flex items-start justify-between">
                                                 <span className="text-[6px] font-black text-muted-foreground/30">#{idx + 1}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className={`text-[8px] font-black uppercase truncate ${idx === 0 ? 'text-amber-600' : 'text-foreground'}`}>{bot.label || bot.model || "Bot"}</span>
                                                 <span className="text-[6px] text-muted-foreground truncate opacity-50">{bot.serial}</span>
                                              </div>
                                              {idx === 0 && <div className="absolute top-1 right-1 flex items-center gap-0.5 text-[5px] font-black uppercase bg-amber-600 text-white px-1 py-0.5 shadow-md"><Sparkles className="size-1.5 mr-0.5" /> Principal</div>}
                                           </motion.div>
                                         );
                                       })}
                                     </AnimatePresence>
                                   </div>
                                 </CollapsibleContent>
                               </Collapsible>

                                 {/* SELECTOR INTERNO (EDICIÓN COMPACTO) */}
                                 {isBotSelectorOpen && (
                                   <div className="absolute inset-0 bg-background z-[200] flex flex-col animate-in fade-in zoom-in-95 duration-300 text-foreground">
                                     <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0 shadow-sm">
                                        <div className="flex flex-col gap-0.5">
                                           <div className="flex items-center gap-2">
                                             <Bot className="size-4 text-blue-500" />
                                             <p className="text-[10px] font-black uppercase tracking-widest">Orquestador de Dispositivos</p>
                                           </div>
                                           <div className="flex items-center gap-2">
                                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter bg-muted px-1.5 py-0.5 border border-border">
                                                {editForm.selectedDeviceIds?.length || 0} Seleccionados
                                              </span>
                                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                de {allDevices.filter(d => d.status === 'LIBRE' || (editForm.selectedDeviceIds || []).includes(d.id)).length} Disponibles
                                              </span>
                                           </div>
                                        </div>
                                        <button onClick={() => setIsBotSelectorOpen(false)} className="p-2 border border-border hover:bg-blue-600 hover:text-white transition-all active:scale-90"><X className="size-4" /></button>
                                     </div>
                                     <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-muted/5">
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                         {allDevices.map((bot, bIdx) => {
                                           const isSelected = (editForm.selectedDeviceIds || []).includes(bot.id);
                                           const isAvailable = bot.status === 'LIBRE';
                                           return (
                                             <button
                                               key={bot.id}
                                               onClick={() => toggleBotSelection(bot.id)}
                                               disabled={!isAvailable && !isSelected}
                                               className={`flex items-center gap-3 p-3 border transition-all relative overflow-hidden group ${
                                                 isSelected
                                                   ? 'border-blue-600 bg-blue-600/10 ring-1 ring-blue-600/30'
                                                   : isAvailable ? 'border-border bg-white/5 hover:border-blue-500/30 hover:bg-muted/10' : 'opacity-30 cursor-not-allowed bg-black/5'
                                               }`}
                                             >
                                               <div className={`size-8 flex items-center justify-center shrink-0 border transition-all ${isSelected ? (editForm.selectedDeviceIds?.[0] === bot.id ? 'border-amber-500 bg-amber-500/20' : 'border-blue-500/40 bg-blue-500/10') : 'border-border bg-muted/20'}`}>
                                                  {isSelected ? (
                                                    editForm.selectedDeviceIds?.[0] === bot.id 
                                                      ? <Sparkles className="size-4 text-amber-500 animate-pulse" /> 
                                                      : <CheckCircle2 className="size-4 text-blue-500" />
                                                  ) : (
                                                    <Bot className={`size-4 ${isAvailable ? 'text-muted-foreground/40' : 'text-red-500/20'}`} />
                                                  )}
                                               </div>
                                               <div className="flex flex-col items-start min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 w-full">
                                                    <span className={`text-[9px] font-black uppercase truncate tracking-tight ${isSelected ? (editForm.selectedDeviceIds?.[0] === bot.id ? 'text-amber-500' : 'text-blue-500') : ''}`}>{bot.label || bot.model || "Bot"}</span>
                                                    {editForm.selectedDeviceIds?.[0] === bot.id && <span className="text-[6px] font-bold bg-amber-500 text-white px-1 py-0.5 uppercase tracking-tighter shrink-0">Main</span>}
                                                  </div>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className={`size-1.5 rounded-full ${isAvailable ? 'bg-green-500' : isSelected ? (editForm.selectedDeviceIds?.[0] === bot.id ? 'bg-amber-500' : 'bg-blue-500') : 'bg-red-500'}`} />
                                                    <span className="text-[7px] text-muted-foreground/60 font-mono truncate uppercase">{bot.serial}</span>
                                                  </div>
                                               </div>
                                               {isSelected && (
                                                 <button 
                                                   onClick={(e) => { e.stopPropagation(); setAsPrimaryBot(bot.id); }}
                                                   className={`p-1.5 transition-all ${editForm.selectedDeviceIds?.[0] === bot.id ? 'text-amber-500 cursor-default' : 'text-muted-foreground/20 hover:text-blue-500 hover:bg-blue-500/10'}`}
                                                 >
                                                   <Sparkles className={`size-3 ${editForm.selectedDeviceIds?.[0] === bot.id ? 'fill-current' : ''}`} />
                                                 </button>
                                               )}
                                               <span className="absolute top-1 right-1 text-[7px] font-bold text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors">#{bIdx + 1}</span>
                                             </button>
                                           );
                                         })}
                                       </div>
                                     </div>
                                     <div className="p-4 border-t border-border flex justify-end bg-card shrink-0">
                                        <button onClick={() => setIsBotSelectorOpen(false)} className="px-8 py-2.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-blue-600/20">Confirmar</button>
                                     </div>
                                   </div>
                                 )}
                               
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
    </div>
  );
}

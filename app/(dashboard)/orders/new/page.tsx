import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Orden de Marketplace</CardTitle>
          <CardDescription>
            Crea una nueva orden para el marketplace de Facebook.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="project">Seleccionar Proyecto</Label>
              <Select>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">Proyecto Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL del Producto</Label>
              <Input id="url" placeholder="https://www.facebook.com/marketplace/item/..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad de Acciones</Label>
              <Input id="quantity" type="number" defaultValue={1} />
            </div>
            <Button className="w-full">Crear Orden</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

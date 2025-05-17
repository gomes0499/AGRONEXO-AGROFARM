import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";

export default function CommercialNotFound() {
  return (
    <div className="container p-4">
      <Card className="border-gray-200 max-w-3xl mx-auto">
        <CardHeader className="bg-gray-50">
          <div className="flex items-center space-x-2">
            <SearchXIcon className="h-6 w-6 text-gray-500" />
            <CardTitle className="text-gray-700">Página Não Encontrada</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            O módulo comercial que você está procurando não existe
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-gray-100 p-8 rounded-full">
              <SearchXIcon className="h-12 w-12 text-gray-500" />
            </div>
            
            <p className="text-gray-700 max-w-lg">
              A página do módulo comercial que você está tentando acessar não foi encontrada.
              Pode ser que o recurso tenha sido movido ou excluído.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link href="/dashboard/commercial" passHref>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  Módulo Comercial
                </Button>
              </Link>
              
              <Link href="/dashboard" passHref>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <HomeIcon className="h-4 w-4" />
                  Voltar para o Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
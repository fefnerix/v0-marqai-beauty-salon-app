"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Building, Bell, Shield, Palette, Clock, Save, LogOut } from "lucide-react"

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  })

  const [workingHours, setWorkingHours] = useState({
    monday: { start: "08:00", end: "18:00", enabled: true },
    tuesday: { start: "08:00", end: "18:00", enabled: true },
    wednesday: { start: "08:00", end: "18:00", enabled: true },
    thursday: { start: "08:00", end: "18:00", enabled: true },
    friday: { start: "08:00", end: "18:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: true },
    sunday: { start: "10:00", end: "16:00", enabled: false },
  })

  const dayNames = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <Sidebar />
      </aside>

      <div className="flex-1 md:ml-64">
        <Header />

        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações do seu salão</p>
              </div>
            </div>

            <Tabs defaultValue="perfil" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="perfil" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="empresa" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Empresa</span>
                </TabsTrigger>
                <TabsTrigger value="horarios" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Horários</span>
                </TabsTrigger>
                <TabsTrigger value="notificacoes" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificações</span>
                </TabsTrigger>
                <TabsTrigger value="seguranca" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Segurança</span>
                </TabsTrigger>
                <TabsTrigger value="aparencia" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Aparência</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="/diverse-user-avatars.png?key=admin&height=80&width=80&query=admin avatar" />
                        <AvatarFallback className="text-lg">AD</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline">Alterar Foto</Button>
                        <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input id="nome" defaultValue="Administrador do Sistema" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="admin@marqai.com" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" defaultValue="(11) 99999-9999" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input id="cargo" defaultValue="Proprietário" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="empresa" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Empresa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-empresa">Nome da Empresa</Label>
                        <Input id="nome-empresa" defaultValue="Salão Beleza & Estilo" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input id="endereco" defaultValue="Rua das Flores, 123 - Centro, São Paulo - SP" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefone-empresa">Telefone</Label>
                        <Input id="telefone-empresa" defaultValue="(11) 3333-4444" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-empresa">Email</Label>
                        <Input id="email-empresa" type="email" defaultValue="contato@salaobeleza.com" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        defaultValue="Salão de beleza especializado em cortes modernos, coloração e tratamentos capilares. Atendemos homens e mulheres com profissionais qualificados."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="horarios" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Horários de Funcionamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(workingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Switch
                            checked={hours.enabled}
                            onCheckedChange={(checked) =>
                              setWorkingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day as keyof typeof prev], enabled: checked },
                              }))
                            }
                          />
                          <Label className="font-medium w-32">{dayNames[day as keyof typeof dayNames]}</Label>
                        </div>

                        {hours.enabled ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={hours.start}
                              onChange={(e) =>
                                setWorkingHours((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], start: e.target.value },
                                }))
                              }
                              className="w-24"
                            />
                            <span>às</span>
                            <Input
                              type="time"
                              value={hours.end}
                              onChange={(e) =>
                                setWorkingHours((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], end: e.target.value },
                                }))
                              }
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <Badge variant="secondary">Fechado</Badge>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Horários
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notificacoes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferências de Notificação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Notificações por Email</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba notificações sobre agendamentos e lembretes
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Notificações por SMS</Label>
                          <p className="text-sm text-muted-foreground">Receba SMS para agendamentos urgentes</p>
                        </div>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms: checked }))}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Notificações Push</Label>
                          <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                        </div>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Marketing</Label>
                          <p className="text-sm text-muted-foreground">Receba dicas e novidades sobre o marqai</p>
                        </div>
                        <Switch
                          checked={notifications.marketing}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing: checked }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Preferências
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seguranca" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Segurança da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Alterar Senha</Label>
                        <div className="space-y-2 mt-2">
                          <Input type="password" placeholder="Senha atual" />
                          <Input type="password" placeholder="Nova senha" />
                          <Input type="password" placeholder="Confirmar nova senha" />
                        </div>
                        <Button className="mt-2">Alterar Senha</Button>
                      </div>

                      <Separator />

                      <div>
                        <Label className="font-medium">Sessões Ativas</Label>
                        <p className="text-sm text-muted-foreground mb-4">Gerencie onde você está logado</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Navegador Atual</p>
                              <p className="text-sm text-muted-foreground">Chrome • São Paulo, SP</p>
                            </div>
                            <Badge variant="default">Ativo</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aparencia" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalização</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Tema</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Escolha como o marqai deve aparecer para você
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <div className="w-full h-20 bg-white border rounded mb-2"></div>
                            <p className="text-sm font-medium text-center">Claro</p>
                          </div>
                          <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                            <p className="text-sm font-medium text-center">Escuro</p>
                          </div>
                          <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 border rounded mb-2"></div>
                            <p className="text-sm font-medium text-center">Sistema</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sair da Conta</p>
                    <p className="text-sm text-muted-foreground">Desconectar de todos os dispositivos</p>
                  </div>
                  <Button variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

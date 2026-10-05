import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Framework v1 Core Auth & ACL API',
    version: '1.0.0',
    description: `API Documentation untuk backend Framework v1 Core Auth & Access Control List (ACL).
    
Fitur Keamanan:
- Gunakan endpoint **/api/auth/login** untuk mendapatkan JWT token.
- Klik tombol **Authorize** di atas, masukkan token (tanpa perlu ketik 'Bearer ' jika menggunakan format http bearer).`,
    contact: {
      name: 'Framework v1 Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Development Server (Local)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT token yang didapat dari /api/auth/login',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'admin',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT Access Token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          sub: { type: 'string', example: 'USR001' },
          username: { type: 'string', example: 'admin' },
          jenis: { type: 'string', example: 'SA' },
          idRelasi: { type: 'string', example: 'REL001' },
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                menuId: { type: 'number', example: 1 },
                enable: { type: 'number', example: 1 },
                level: { type: 'number', example: 4 },
              },
            },
          },
        },
      },
      Menu: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          upline: { type: 'integer', nullable: true, example: 0 },
          urut: { type: 'integer', example: 1 },
          nama: { type: 'string', example: 'Dashboard' },
          tipe: { type: 'string', enum: ['Header', 'Detail'], example: 'Detail' },
          level: { type: 'integer', example: 1 },
          link: { type: 'string', example: '/dashboard' },
          icon: { type: 'string', example: 'LayoutDashboard' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      CreateMenuRequest: {
        type: 'object',
        required: ['upline', 'urut', 'nama', 'tipe', 'level'],
        properties: {
          upline: { type: 'integer', example: 0 },
          urut: { type: 'integer', example: 1 },
          nama: { type: 'string', example: 'Manajemen Pengguna' },
          tipe: { type: 'string', enum: ['Header', 'Detail'], example: 'Detail' },
          level: { type: 'integer', example: 1 },
          link: { type: 'string', example: '/users' },
          icon: { type: 'string', example: 'Users' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      UpdateMenuRequest: {
        type: 'object',
        properties: {
          upline: { type: 'integer', example: 0 },
          urut: { type: 'integer', example: 1 },
          nama: { type: 'string', example: 'Manajemen Pengguna Updated' },
          tipe: { type: 'string', enum: ['Header', 'Detail'], example: 'Detail' },
          level: { type: 'integer', example: 1 },
          link: { type: 'string', example: '/users' },
          icon: { type: 'string', example: 'Users' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ADM' },
          nama: { type: 'string', example: 'Administrator' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      CreateRoleRequest: {
        type: 'object',
        required: ['id', 'nama'],
        properties: {
          id: { type: 'string', example: 'OPERATOR' },
          nama: { type: 'string', example: 'Operator Lapangan' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      UpdateRoleRequest: {
        type: 'object',
        properties: {
          nama: { type: 'string', example: 'Operator Lapangan Updated' },
          aktif: { type: 'integer', example: 1 },
        },
      },
      RoleAclItem: {
        type: 'object',
        required: ['menuId', 'enable', 'level'],
        properties: {
          menuId: { type: 'integer', example: 1 },
          enable: { type: 'integer', example: 1, description: '1: Aktif, 0: Nonaktif' },
          level: { type: 'integer', example: 4, description: 'Level hak akses (misal: 1=R, 2=C, 3=U, 4=D)' },
        },
      },
      RoleAclDetail: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          upline: { type: 'integer', nullable: true, example: 0 },
          urut: { type: 'integer', example: 1 },
          nama: { type: 'string', example: 'Dashboard' },
          tipe: { type: 'string', example: 'Detail' },
          level: { type: 'integer', example: 1 },
          link: { type: 'string', example: '/dashboard' },
          icon: { type: 'string', example: 'LayoutDashboard' },
          aktif: { type: 'integer', example: 1 },
          acl: {
            type: 'object',
            properties: {
              enable: { type: 'integer', example: 1 },
              level: { type: 'integer', example: 1111 },
              c: { type: 'integer', example: 1 },
              r: { type: 'integer', example: 1 },
              u: { type: 'integer', example: 1 },
              d: { type: 'integer', example: 1 },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Pesan kesalahan terjadi.' },
        },
      },
      SuccessMessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operasi berhasil.' },
        },
      },
      UserWithRoles: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-admin-1' },
          username: { type: 'string', example: 'admin' },
          aktif: { type: 'integer', example: 1 },
          tgl1: { type: 'string', format: 'date', example: '2026-01-01' },
          tgl2: { type: 'string', format: 'date', example: '2030-12-31' },
          jenis: { type: 'string', example: 'pegawai' },
          idRelasi: { type: 'string', example: 'peg-1' },
          roles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Role',
            },
          },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['id', 'username', 'password'],
        properties: {
          id: { type: 'string', example: 'usr-operator-1' },
          username: { type: 'string', example: 'operator' },
          password: { type: 'string', format: 'password', example: 'password123' },
          aktif: { type: 'integer', example: 1 },
          tgl1: { type: 'string', format: 'date', example: '2026-01-01' },
          tgl2: { type: 'string', format: 'date', example: '2035-12-31' },
          jenis: { type: 'string', example: 'pegawai' },
          idRelasi: { type: 'string', example: 'peg-2' },
          roleIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['SA', 'OPERATOR'],
          },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'operator_updated' },
          password: { type: 'string', format: 'password', example: 'newpassword123' },
          aktif: { type: 'integer', example: 1 },
          tgl1: { type: 'string', format: 'date', example: '2026-01-01' },
          tgl2: { type: 'string', format: 'date', example: '2035-12-31' },
          jenis: { type: 'string', example: 'pegawai' },
          idRelasi: { type: 'string', example: 'peg-2' },
          roleIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['SA'],
          },
        },
      },
      AssignUserRolesRequest: {
        type: 'object',
        required: ['roleIds'],
        properties: {
          roleIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['SA', 'OPERATOR'],
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login pengguna',
        description: 'Login menggunakan username dan password untuk memperoleh JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          400: {
            description: 'Login gagal / kredensial salah',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Mendapatkan data profil user yang sedang login',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Data profil user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      $ref: '#/components/schemas/UserProfile',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token tidak valid atau tidak disertakan',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin / Dashboard'],
        summary: 'Uji coba akses dashboard (Memerlukan izin Menu ID 1, Level 1)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Akses dashboard berhasil diverifikasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          401: {
            description: 'Tidak terautentikasi',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          403: {
            description: 'Akses ditolak oleh ACL',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/user/menus': {
      get: {
        tags: ['Menu Navigation'],
        summary: 'Mendapatkan hierarki menu yang diizinkan untuk user saat ini',
        description: 'Menghasilkan menu bertingkat (tree hierarchy) berdasarkan hak akses (ACL) user yang sedang login.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Daftar menu bertingkat untuk navigasi sidebar',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
          401: {
            description: 'Tidak terautentikasi',
          },
        },
      },
    },
    '/api/menus': {
      get: {
        tags: ['Menu Management'],
        summary: 'Mendapatkan seluruh daftar menu (Management)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Daftar semua menu',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Menu',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      post: {
        tags: ['Menu Management'],
        summary: 'Membuat menu baru',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateMenuRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Menu berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Menu',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/menus/{id}': {
      get: {
        tags: ['Menu Management'],
        summary: 'Mendapatkan detail menu berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Menu',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Detail menu',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Menu',
                },
              },
            },
          },
          404: { description: 'Menu tidak ditemukan' },
          401: { description: 'Tidak terautentikasi' },
        },
      },
      put: {
        tags: ['Menu Management'],
        summary: 'Mengubah data menu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Menu',
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateMenuRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Menu berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Menu',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      delete: {
        tags: ['Menu Management'],
        summary: 'Menghapus menu berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Menu',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Menu berhasil terhapus',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          400: { description: 'Gagal menghapus menu' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/roles': {
      get: {
        tags: ['Role Management'],
        summary: 'Mendapatkan seluruh daftar role/grup',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Daftar seluruh role',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Role',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      post: {
        tags: ['Role Management'],
        summary: 'Membuat role baru',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateRoleRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Role berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/roles/{id}': {
      get: {
        tags: ['Role Management'],
        summary: 'Mendapatkan detail role berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Role',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Detail role',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
          404: { description: 'Role tidak ditemukan' },
          401: { description: 'Tidak terautentikasi' },
        },
      },
      put: {
        tags: ['Role Management'],
        summary: 'Mengubah data role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Role',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateRoleRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Role berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Role',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      delete: {
        tags: ['Role Management'],
        summary: 'Menghapus role berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Role',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Role berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          400: { description: 'Gagal menghapus role' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/roles/{id}/acls': {
      get: {
        tags: ['Role ACL Management'],
        summary: 'Mendapatkan data ACL menu untuk role tertentu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Role',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Daftar menu beserta status hak akses untuk role tersebut',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/RoleAclDetail',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      put: {
        tags: ['Role ACL Management'],
        summary: 'Menyimpan pembaharuan seluruh ACL untuk role tertentu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Role',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/RoleAclItem',
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ACL berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/roles/acls/template': {
      get: {
        tags: ['Role ACL Management'],
        summary: 'Mendapatkan template default ACL seluruh menu',
        description: 'Digunakan ketika membuat role baru untuk menginisialisasi tabel checklist ACL.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Template ACL kosong untuk seluruh menu',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/RoleAclDetail',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['User & Role-User Management'],
        summary: 'Mendapatkan seluruh daftar pengguna beserta role yang dimiliki',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Daftar pengguna dengan roles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/UserWithRoles',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      post: {
        tags: ['User & Role-User Management'],
        summary: 'Membuat pengguna baru beserta penugasan role awal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Pengguna berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserWithRoles',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['User & Role-User Management'],
        summary: 'Mendapatkan detail pengguna berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Pengguna (misal: usr-admin-1)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Detail pengguna',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserWithRoles',
                },
              },
            },
          },
          404: { description: 'Pengguna tidak ditemukan' },
          401: { description: 'Tidak terautentikasi' },
        },
      },
      put: {
        tags: ['User & Role-User Management'],
        summary: 'Mengubah data pengguna dan roles',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Pengguna',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Pengguna berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserWithRoles',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      delete: {
        tags: ['User & Role-User Management'],
        summary: 'Menghapus pengguna berdasarkan ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Pengguna',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Pengguna berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          400: { description: 'Gagal menghapus pengguna' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/users/{id}/roles': {
      get: {
        tags: ['User & Role-User Management'],
        summary: 'Mendapatkan role yang dimiliki pengguna',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Pengguna',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Daftar role pengguna',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Role',
                  },
                },
              },
            },
          },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
      put: {
        tags: ['User & Role-User Management'],
        summary: 'Menugaskan satu atau lebih role ke pengguna',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Pengguna',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AssignUserRolesRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Role pengguna berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SuccessMessageResponse',
                },
              },
            },
          },
          400: { description: 'Permintaan tidak valid' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/operation-units/tree': {
      get: {
        summary: 'Ambil seluruh hierarki pohon Operation Unit (HO > Regional > AO > Cabang/Gudang)',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Struktur pohon hierarki unit organisasi' },
          401: { description: 'Tidak terautentikasi' },
          403: { description: 'Akses ditolak' },
        },
      },
    },
    '/api/operation-units': {
      get: {
        summary: 'Ambil daftar datar Operation Unit',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'type', schema: { type: 'string' }, description: 'Filter tipe unit (HEAD_OFFICE, REGIONAL, AREA_OFFICE, OPERATION_UNIT)' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Cari berdasarkan kode, nama, atau alamat' },
          { in: 'query', name: 'status', schema: { type: 'boolean' }, description: 'Filter status aktif' },
        ],
        responses: {
          200: { description: 'Daftar Operation Unit' },
        },
      },
      post: {
        summary: 'Buat Operation Unit baru',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'name', 'type'],
                properties: {
                  parentId: { type: 'string', format: 'uuid', description: 'ID Unit Induk (wajib kecuali HO)' },
                  code: { type: 'string', example: 'CAB-PST' },
                  name: { type: 'string', example: 'Cabang Pasteur' },
                  type: { type: 'string', enum: ['HEAD_OFFICE', 'REGIONAL', 'AREA_OFFICE', 'OPERATION_UNIT'], example: 'OPERATION_UNIT' },
                  category: { type: 'string', example: 'Cabang' },
                  address: { type: 'string', example: 'Jl. Dr. Djunjunan No. 123' },
                  phone: { type: 'string', example: '+62222012345' },
                  latitude: { type: 'number', example: -6.891234 },
                  longitude: { type: 'number', example: 107.589123 },
                  buildingStatus: { type: 'string', example: 'Sewa' },
                  annualRent: { type: 'number', example: 150000000 },
                  status: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Operation Unit berhasil dibuat' },
          400: { description: 'Permintaan tidak valid' },
        },
      },
    },
    '/api/operation-units/{id}': {
      get: {
        summary: 'Ambil detail Operation Unit beserta lineage hierarki (breadcrumb)',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detail Operation Unit' },
          404: { description: 'Unit tidak ditemukan' },
        },
      },
      put: {
        summary: 'Perbarui Operation Unit',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  address: { type: 'string' },
                  status: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Operation Unit berhasil diperbarui' },
        },
      },
      delete: {
        summary: 'Hapus Operation Unit (jika tidak memiliki anak dan karyawan)',
        tags: ['Operation Unit'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Operation Unit berhasil dihapus' },
          400: { description: 'Unit tidak dapat dihapus karena memiliki ketergantungan' },
        },
      },
    },
    '/api/karyawan': {
      get: {
        summary: 'Ambil daftar Master Karyawan (otomatis difilter sesuai scope wilayah user)',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Cari NIK, nomor karyawan, nama, email, hp' },
          { in: 'query', name: 'operationUnitId', schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'status', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Daftar Karyawan beserta pagination' },
        },
      },
      post: {
        summary: 'Input Master Karyawan baru (32 Kolom)',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['operationUnitId', 'employeeNumber', 'nik', 'legalName'],
                properties: {
                  operationUnitId: { type: 'string', format: 'uuid', description: 'ID Unit Penempatan' },
                  supervisorId: { type: 'string', format: 'uuid', description: 'ID Karyawan Atasan Langsung' },
                  employeeNumber: { type: 'string', example: 'EMP-2026-001' },
                  nik: { type: 'string', example: '3273010101900001' },
                  legalName: { type: 'string', example: 'Budi Santoso' },
                  email: { type: 'string', example: 'budi.santoso@perusahaan.com' },
                  phone: { type: 'string', example: '+6281234567890' },
                  sex: { type: 'string', example: 'Laki-laki' },
                  maritalStatus: { type: 'string', example: 'Menikah' },
                  religion: { type: 'string', example: 'Islam' },
                  placeOfBirth: { type: 'string', example: 'Bandung' },
                  dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
                  lastEducation: { type: 'string', example: 'S1' },
                  address: { type: 'string', example: 'Jl. Cibogo Atas No. 45' },
                  postalCode: { type: 'string', example: '40164' },
                  originalDateOfHire: { type: 'string', format: 'date', example: '2026-01-10' },
                  permanentDate: { type: 'string', format: 'date', example: '2026-04-10' },
                  accountName: { type: 'string', example: 'Budi Santoso' },
                  accountNumber: { type: 'string', example: '1234567890' },
                  status: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Karyawan berhasil dibuat' },
          400: { description: 'Permintaan tidak valid' },
        },
      },
    },
    '/api/karyawan/{id}': {
      get: {
        summary: 'Ambil detail lengkap Karyawan (32 kolom + lineage unit penempatan + akun login)',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detail lengkap Karyawan' },
          404: { description: 'Karyawan tidak ditemukan' },
        },
      },
      put: {
        summary: 'Perbarui data Karyawan',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  legalName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  operationUnitId: { type: 'string', format: 'uuid' },
                  supervisorId: { type: 'string', format: 'uuid' },
                  status: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Karyawan berhasil diperbarui' },
        },
      },
      delete: {
        summary: 'Hapus data Karyawan',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Karyawan berhasil dihapus' },
          400: { description: 'Karyawan tidak dapat dihapus karena memiliki bawahan' },
        },
      },
    },
    '/api/karyawan/{id}/subordinates': {
      get: {
        summary: 'Ambil daftar bawahan langsung (subordinates) dari seorang Karyawan/Supervisor',
        tags: ['Master Karyawan'],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Daftar bawahan langsung' },
        },
      },
    },
  },
};

const swaggerOptions: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/presentation/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  const customCss = `
    .swagger-ui .topbar { display: flex; align-items: center; background-color: #1e293b; padding: 10px 0; }
    .swagger-ui .topbar .topbar-wrapper { width: 100%; max-width: 1460px; margin: 0 auto; padding: 0 20px; }
    .swagger-ui .topbar-wrapper img { content: url('https://swagger.io/validator?url='); display: none; }
    .swagger-ui .topbar-wrapper .link { font-weight: 700; color: #38bdf8; font-size: 1.25rem; }
  `;

  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
      },
      customCss,
      customSiteTitle: 'Framework v1 - API Documentation',
    })
  );

  // Serve raw JSON specification
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

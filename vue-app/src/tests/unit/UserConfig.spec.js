// UserConfig.spec.js
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import UserConfig from '@/components/UserConfig.vue'

// Mock Vuex store
const createMockStore = (userLevel = 3) => {
  return createStore({
    state: {},
    getters: {
      level: () => userLevel,
      dID: () => 'test-did'
    },
    actions: {
      toLowerCase: jest.fn((context, text) => text.toLowerCase()),
      'websocket/send': jest.fn()
    }
  })
}

// Mock router-link component
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a><slot></slot></a>',
  props: ['to']
}

describe('UserConfig.vue', () => {
  let store
  let wrapper

  beforeEach(() => {
    store = createMockStore()
    wrapper = mount(UserConfig, {
      global: {
        plugins: [store],
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the component correctly', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('displays navigation links based on user level', () => {
      const links = wrapper.findAllComponents(RouterLinkStub)
      expect(links.length).toBe(6) // All links including admin ones
    })

    it('renders user creation form', () => {
      expect(wrapper.find('h2').text()).toBe('Создать нового пользователя')
      expect(wrapper.find('input#username').exists()).toBe(true)
      expect(wrapper.find('input#password').exists()).toBe(true)
      expect(wrapper.find('input#dataSource').exists()).toBe(true)
      expect(wrapper.find('select#permissionLevel').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').text()).toBe('Создать пользователя')
    })

    // it('renders user-dataSource linking form', () => {
    //   const headings = wrapper.findAll('h2')
    //   expect(headings.at(1).text()).toBe('Связать пользователя с источником данных')
    //   expect(wrapper.find('select#existingUser').exists()).toBe(true)
    //   expect(wrapper.find('select#existingDataSource').exists()).toBe(true)
    //   expect(wrapper.find('button[type="submit"]').text()).toBe('Связать')
    // })
  })

  describe('Form Validation', () => {
    describe('Username validation', () => {
      it('shows error for short username', async () => {
        const usernameInput = wrapper.find('input#username')
        await usernameInput.setValue('ab')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.username).toBe('Имя пользователя должно быть от 3 до 16 символов.')
      })

      it('shows error for long username', async () => {
        const usernameInput = wrapper.find('input#username')
        await usernameInput.setValue('a'.repeat(17))
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.username).toBe('Имя пользователя должно быть от 3 до 16 символов.')
      })

      it('accepts valid username', async () => {
        const usernameInput = wrapper.find('input#username')
        await usernameInput.setValue('validuser')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.username).toBe('')
      })
    })

    describe('Password validation', () => {
      it('shows error for weak password', async () => {
        const passwordInput = wrapper.find('input#password')
        await passwordInput.setValue('weakpass')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.password).toBe('Пароль должен быть от 10 до 32 символов, содержать минимум одну заглавную букву, цифру и спецсимвол.')
      })

      it('accepts valid password', async () => {
        const passwordInput = wrapper.find('input#password')
        await passwordInput.setValue('ValidPass1!')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.password).toBe('')
      })
    })

    describe('DataSource validation', () => {
      it('shows error for invalid dataSource format', async () => {
        const dataSourceInput = wrapper.find('input#dataSource')
        await dataSourceInput.setValue('1invalid')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.dataSource).toBe('Источник данных должен быть от 4 до 16 символов, начинаться с буквы или _ и содержать только буквы, цифры, _ и $')
      })

      it('shows error for SQL reserved word', async () => {
        const dataSourceInput = wrapper.find('input#dataSource')
        await dataSourceInput.setValue('SELECT')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.dataSource).toBe('Источник данных не может быть зарезервированным словом SQL')
      })

      it('accepts valid dataSource', async () => {
        const dataSourceInput = wrapper.find('input#dataSource')
        await dataSourceInput.setValue('valid_source')
        await wrapper.vm.createUser()
        
        expect(wrapper.vm.errors.dataSource).toBe('')
      })
    })
  })

  describe('API Interactions', () => {
    // it('calls createUser API with correct payload when form is valid', async () => {
    //   // Set valid form data
    //   await wrapper.find('input#username').setValue('testuser')
    //   await wrapper.find('input#password').setValue('ValidPass1!')
    //   await wrapper.find('input#dataSource').setValue('test_source')
    //   await wrapper.find('select#permissionLevel').setValue('2')

    //   // Mock successful API response
    //   store.dispatch.mockResolvedValueOnce({})

    //   await wrapper.vm.createUser()

    //   expect(store.dispatch).toHaveBeenCalledWith('websocket/send', {
    //     type: 'post',
    //     request: 'createUser',
    //     name: 'test-did',
    //     payload: {
    //       username: 'testuser',
    //       password: 'ValidPass1!',
    //       dataSource: 'test_source',
    //       permissionLevel: '2'
    //     }
    //   })
    // })

    // it('calls linkUserToDataSource API with correct payload', async () => {
    //   // Set up test data
    //   wrapper.vm.usersDB = [
    //     { id: 1, username: 'user1' },
    //     { id: 2, username: 'user2' }
    //   ]
    //   wrapper.vm.dataSources = [
    //     { id: 101, did: 'source1' },
    //     { id: 102, did: 'source2' }
    //   ]
    //   wrapper.vm.selectedUser = 1
    //   wrapper.vm.selectedDataSource = 101

    //   // Mock successful API response
    //   const mockResponse = {
    //     exists: true,
    //     payload: { linkId: 999 }
    //   }
    //   store.dispatch.mockResolvedValueOnce(mockResponse)

    //   await wrapper.vm.linkUserToDataSource()

    //   expect(store.dispatch).toHaveBeenCalledWith('websocket/send', {
    //     type: 'post',
    //     request: 'linkUserToDataSource',
    //     name: 'test-did',
    //     payload: {
    //       userId: 1,
    //       dataSourceId: 101
    //     }
    //   })
    // })

    // it('shows error when linking without selection', async () => {
    //   wrapper.vm.selectedUser = null
    //   wrapper.vm.selectedDataSource = null

    //   await wrapper.vm.linkUserToDataSource()

    //   expect(store.dispatch).not.toHaveBeenCalled()
    // })
  })

  describe('Data Fetching', () => {
    // it('fetches users and data sources on mount', async () => {
    //   const mockUsersResponse = {
    //     payload: {
    //       users: [
    //         { id: 1, username: 'user1' },
    //         { id: 2, username: 'user2' }
    //       ]
    //     }
    //   }

    //   const mockDataSourcesResponse = {
    //     payload: {
    //       sources: [
    //         { id: 101, did: 'source1' },
    //         { id: 102, did: 'source2' }
    //       ]
    //     }
    //   }

    //   store.dispatch
    //     .mockResolvedValueOnce(mockUsersResponse)
    //     .mockResolvedValueOnce(mockDataSourcesResponse)

    //   await wrapper.vm.fetchUsers()
    //   await wrapper.vm.fetchDataSources()

    //   expect(wrapper.vm.usersDB).toEqual([
    //     { id: 1, username: 'user1' },
    //     { id: 2, username: 'user2' }
    //   ])

    //   expect(wrapper.vm.dataSources).toEqual([
    //     { id: 101, did: 'source1' },
    //     { id: 102, did: 'source2' }
    //   ])
    // })

    // it('handles API errors gracefully', async () => {
    //   store.dispatch.mockRejectedValueOnce(new Error('API Error'))

    //   await wrapper.vm.fetchUsers()

    //   expect(wrapper.vm.successMessage).toBe('Ошибка при загрузке списка пользователей')
    // })
  })

  describe('User Permissions', () => {
    it('hides admin links for low-level users', async () => {
      const lowLevelStore = createMockStore(1)
      const lowLevelWrapper = mount(UserConfig, {
        global: {
          plugins: [lowLevelStore],
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      })

      const links = lowLevelWrapper.findAllComponents(RouterLinkStub)
      expect(links.length).toBe(4) // Only basic links (login, dashboard, smart-home, automation)
    })
  })

  describe('Utility Functions', () => {
    // it('clears errors correctly', () => {
    //   wrapper.vm.errors = {
    //     username: 'Error',
    //     password: 'Error',
    //     dataSource: 'Error'
    //   }

    //   wrapper.vm.clearErrors()

    //   expect(wrapper.vm.errors).toEqual({
    //     username: '',
    //     password: '',
    //     dataSource: ''
    //   })
    // })
  })

  describe('Form Submission', () => {
    // it('prevents default form submission', async () => {
    //   const form = wrapper.find('form')
    //   const submitEvent = { preventDefault: jest.fn() }
      
    //   await form.trigger('submit', submitEvent)
      
    //   expect(submitEvent.preventDefault).toHaveBeenCalled()
    // })
  })
})
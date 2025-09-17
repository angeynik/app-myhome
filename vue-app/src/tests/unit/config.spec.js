// src/tests/unit/config.spec.js
import configModule from '@/store/modules/config';

describe('Vuex config module', () => {
  let state;
  let context;

  beforeEach(() => {
    state = configModule.state();
    context = {
      state,
      commit: jest.fn(),
      dispatch: jest.fn(),
      rootGetters: {
        dID: 'device123',
        roomKey: null,
        paramKey: null
      }
    };
  });

  // ✅ MUTATIONS
  describe('mutations', () => {
    it('SET_CONFIG updates configs', () => {
      const payload = {
        name: 'device123',
        config: { room1: { sensors: { temp1: { value: 22 } } } }
      };
      configModule.mutations.SET_CONFIG(state, payload);
      expect(state.configs['device123']).toEqual(payload.config);
    });

    // it('UPDATE_SENSOR_VALUE updates sensor value and timestamp', () => {
    //   state.configs['device123'] = {
    //     room1: {
    //       sensors: {
    //         temp1: { value: 20, lastUpdate: null }
    //       }
    //     }
    //   };
    //   const payload = {
    //     dID: 'device123',
    //     room: 'room1',
    //     sensor: 'temp1',
    //     value: 25,
    //     timestamp: '2025-09-16T19:00:00Z'
    //   };
    //   configModule.mutations.UPDATE_SENSOR_VALUE(state, payload);
    //   expect(state.configs['device123'].room1.sensors.temp1.value).toBe(25);
    //   expect(state.configs['device123'].room1.sensors.temp1.lastUpdate).toBe(payload.timestamp);
    // });

    it('SET_LOADING updates loading', () => {
      configModule.mutations.SET_LOADING(state, true);
      expect(state.loading).toBe(true);
    });

    it('SET_ERROR updates error', () => {
      const error = new Error('Test error');
      configModule.mutations.SET_ERROR(state, error);
      expect(state.error).toBe(error);
    });

    it('SET_MOBILE updates mobile', () => {
      configModule.mutations.SET_MOBILE(state, true);
      expect(state.mobile).toBe(true);
    });

    it('SET_DEVICE_TYPE updates deviceType', () => {
      configModule.mutations.SET_DEVICE_TYPE(state, 'tablet');
      expect(state.deviceType).toBe('tablet');
    });
      it('UPDATE_CONFIG_VALUE updates existing sensor', () => {
    state.configs['device123'] = {
      room1: {
        sensors: {
          temp1: { value: 20, lastUpdate: null }
        }
      }
    };

    const payload = {
      dID: 'device123',
      room: 'room1',
      type: 'sensors',
      name: 'temp1',
      value: 25,
      timestamp: '2025-09-16T19:00:00Z'
    };

    configModule.mutations.UPDATE_CONFIG_VALUE(state, payload);

    expect(state.configs['device123'].room1.sensors.temp1.value).toBe(25);
    expect(state.configs['device123'].room1.sensors.temp1.lastUpdate).toBe(payload.timestamp);
  });

  it('UPDATE_CONFIG_VALUE creates missing type and sensor', () => {
    state.configs['device123'] = {
      room1: {}
    };

    const payload = {
      dID: 'device123',
      room: 'room1',
      type: 'actuators',
      name: 'a1',
      value: 1.5,
      timestamp: '2025-09-17T10:00:00Z'
    };

    configModule.mutations.UPDATE_CONFIG_VALUE(state, payload);

    expect(state.configs['device123'].room1.actuators.a1.value).toBe(1.5);
    expect(state.configs['device123'].room1.actuators.a1.lastUpdate).toBe(payload.timestamp);
  });

  it('UPDATE_CONFIG_VALUE skips update if dID is missing', () => {
    const payload = {
      dID: 'unknown',
      room: 'room1',
      type: 'sensors',
      name: 'temp1',
      value: 42,
      timestamp: '2025-09-16T19:00:00Z'
    };

    configModule.mutations.UPDATE_CONFIG_VALUE(state, payload);

    expect(state.configs['unknown']).toBeUndefined();
  });

  it('UPDATE_CONFIG_VALUE skips update if room is missing', () => {
    state.configs['device123'] = {};

    const payload = {
      dID: 'device123',
      room: 'roomX',
      type: 'sensors',
      name: 'temp1',
      value: 42,
      timestamp: '2025-09-16T19:00:00Z'
    };

    configModule.mutations.UPDATE_CONFIG_VALUE(state, payload);

    expect(state.configs['device123']['roomX']).toBeUndefined();
  });

  });

  // ✅ GETTERS
  describe('getters', () => {
    it('getConfig returns config by name', () => {
      state.configs['device123'] = { room1: {} };
      const result = configModule.getters.getConfig(state)('device123');
      expect(result).toEqual({ room1: {} });
    });

    it('isLoading returns loading state', () => {
      state.loading = true;
      expect(configModule.getters.isLoading(state)).toBe(true);
    });

    it('error returns error state', () => {
      const error = new Error('Oops');
      state.error = error;
      expect(configModule.getters.error(state)).toBe(error);
    });

    it('getCommonConfig returns config by dID', () => {
      state.configs['device123'] = { room1: {} };
      expect(configModule.getters.getCommonConfig(state)('device123')).toEqual({ room1: {} });
    });

    it('allRooms returns allRooms', () => {
      state.allRooms = ['room1'];
      expect(configModule.getters.allRooms(state)).toEqual(['room1']);
    });

    it('allParams returns allParams', () => {
      state.allParams = ['temp'];
      expect(configModule.getters.allParams(state)).toEqual(['temp']);
    });

    it('getMobile returns mobile flag', () => {
      state.mobile = true;
      expect(configModule.getters.getMobile(state)).toBe(true);
    });

    it('getDeviceType returns deviceType', () => {
      state.deviceType = 'phone';
      expect(configModule.getters.getDeviceType(state)).toBe('phone');
    });
    
  });

  // ✅ ACTIONS
  describe('actions', () => {
    it('initialize calls detectDevice and ensureConfig', async () => {
      context.dispatch.mockImplementation(async (action, payload) => {
        if (action === 'ensureConfig') {
          context.state.configs['device123'] = { room1: {} };
        }
      });

      await configModule.actions.initialize(context);

      expect(context.dispatch).toHaveBeenCalledWith('detectDevice');
      expect(context.dispatch).toHaveBeenCalledWith('ensureSortingKeys');
      expect(context.dispatch).toHaveBeenCalledWith('ensureConfig', 'device123');
    });
    it('initialize skips ensureSortingKeys if roomKey and paramKey exist', async () => {
      context.rootGetters = {
        dID: 'device123',
        roomKey: 'room01',
        paramKey: 'dTemp'
      };

      context.state.configs['device123'] = { room1: {} };

      await configModule.actions.initialize(context);

      expect(context.dispatch).toHaveBeenCalledWith('detectDevice');
      expect(context.dispatch).not.toHaveBeenCalledWith('ensureSortingKeys');
    });


    it('initialize calls ensureSortingKeys if roomKey is null', async () => {
      context.rootGetters = {
        dID: 'device123',
        'sortParams/getRoomKey': null,
        'sortParams/getParamKey': 'dTemp'
      };

      context.state.configs['device123'] = { room1: {} };

      await configModule.actions.initialize(context);

      expect(context.dispatch).toHaveBeenCalledWith('ensureSortingKeys');
    });

    it('ensureConfig returns existing config', async () => {
      const config = { room1: {} };
      context.state.configs['device123'] = config;

      await configModule.actions.ensureConfig(context, 'device123');

      expect(context.dispatch).toHaveBeenCalledWith('handleRoomsSet', config);
      expect(context.dispatch).toHaveBeenCalledWith('handleParamsSet', config);
    });

    it('ensureConfig calls requestConfig if missing', async () => {
      context.state.configs = {};
      context.dispatch.mockResolvedValue('mockedConfig');

      const result = await configModule.actions.ensureConfig(context, 'device123');

      expect(context.dispatch).toHaveBeenCalledWith('requestConfig', 'device123');
      expect(result).toEqual('mockedConfig');
    });

    it('handleConfigResponse commits config and updates rooms/params', async () => {
      const response = {
        name: 'device123',
        payload: {
          room1: {
            sensors: {
              temp1: { value: 22 }
            }
          }
        }
      };

      await configModule.actions.handleConfigResponse(context, response);

      expect(context.commit).toHaveBeenCalledWith('SET_CONFIG', {
        name: 'device123',
        config: response.payload
      });

      expect(context.dispatch).toHaveBeenCalledWith('handleRoomsSet', response.payload);
      expect(context.dispatch).toHaveBeenCalledWith('handleParamsSet', response.payload);
      expect(context.dispatch).toHaveBeenCalledWith('ensureSortingKeys');
    });

    it('handleRoomsSet commits filtered room keys', async () => {
        const config = {
            room1: { sensors: { temp1: {} } },
            room2: { sensors: {} },
            room3: {}
        };
        await configModule.actions.handleRoomsSet(context, config);
        expect(context.commit).toHaveBeenCalledWith('SET_ALL_ROOMS', ['room1']);
        });

    it('handleParamsSet commits unique param prefixes', async () => {
    const config = {
        room1: {
        sensors: {
            temp1: {}, humidity2: {}, temp3: {}
        }
        }
    };
    await configModule.actions.handleParamsSet(context, config);
    expect(context.commit).toHaveBeenCalledWith('SET_ALL_PARAMS', expect.arrayContaining(['temp', 'humidity']));
    });


    it('requestConfig dispatches websocket/send and handles response', async () => {
      const mockResponse = {
        name: 'device123',
        payload: { room1: { sensors: { temp1: { value: 22 } } } }
      };

      context.dispatch.mockImplementation(async (action) => {
        if (action === 'websocket/send') return mockResponse;
        if (action === 'handleConfigResponse') return;
      });

      await configModule.actions.requestConfig(context, 'device123');

      expect(context.dispatch).toHaveBeenCalledWith('websocket/send', {
        type: 'get',
        request: 'config',
        name: 'device123'
      }, { root: true });

      expect(context.dispatch).toHaveBeenCalledWith('handleConfigResponse', mockResponse);
    });

    it('updateSetpointLocal updates config and commits SET_CONFIG', async () => {
      context.state.configs['device123'] = {
        room1: {
          setpoints: {
            temp: { value: 20 }
          }
        }
      };

      context.dispatch.mockResolvedValue('temp');

      await configModule.actions.updateSetpointLocal(context, {
        roomKey: 'room1',
        paramKey: 'temp1',
        value: 30
      });

      expect(context.commit).toHaveBeenCalledWith('SET_CONFIG', expect.objectContaining({
        name: 'device123'
      }));

      const updatedConfig = context.commit.mock.calls[0][1].config;
      expect(updatedConfig.room1.setpoints.temp.value).toBe(30);
    });

    it('updateSetpointLocal throws if setpoints missing', async () => {
        context.state.configs['device123'] = {
            room1: {}
        };

        await expect(configModule.actions.updateSetpointLocal(context, {
            roomKey: 'room1',
            paramKey: 'temp1',
            value: 30
        })).rejects.toThrow('Комната room1 или её уставки не найдены');
        });

          it('handleSensorUpdate commits UPDATE_CONFIG_VALUE with correct payload', async () => {
    context.state.configs['device123'] = {
      room1: {
        sensors: {
          temp1: { value: 0 }
        }
      }
    };

    const payload = {
      room: 'room1',
      item_name: 'temp1',
      item_value: 42,
      time: '2025-09-16T19:00:00Z'
    };

    await configModule.actions.handleSensorUpdate(context, {
      dID: 'device123',
      payload,
      type: 'sensors'
    });

    expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', {
      dID: 'device123',
      room: 'room1',
      type: 'sensors',
      name: 'temp1',
      value: 42,
      timestamp: new Date('2025-09-16T19:00:00Z').toString()
    });
  });

  it('handleSensorUpdate creates missing type and sensor', async () => {
    context.state.configs['device123'] = {
      room1: {}
    };

    const payload = {
      room: 'room1',
      item_name: 'a1',
      item_value: 1.5,
      time: '2025-09-17T10:00:00Z'
    };

    await configModule.actions.handleSensorUpdate(context, {
      dID: 'device123',
      payload,
      type: 'actuators'
    });

    expect(context.commit).toHaveBeenCalledWith('UPDATE_CONFIG_VALUE', {
      dID: 'device123',
      room: 'room1',
      type: 'actuators',
      name: 'a1',
      value: 1.5,
      timestamp: new Date('2025-09-17T10:00:00Z').toString()
    });
  });

  it('handleSensorUpdate skips commit if payload is incomplete', async () => {
    const payload = {
      room: null,
      item_name: 'temp1',
      item_value: 42
    };

    await configModule.actions.handleSensorUpdate(context, {
      dID: 'device123',
      payload,
      type: 'sensors'
    });

    expect(context.commit).not.toHaveBeenCalled();
  });

  it('handleSensorUpdate uses current timestamp if time is missing', async () => {
    context.state.configs['device123'] = {
      room1: {
        controller: {
          ctrl1: { value: 0 }
        }
      }
    };

    const payload = {
      room: 'room1',
      item_name: 'ctrl1',
      item_value: 1.5
    };

    await configModule.actions.handleSensorUpdate(context, {
      dID: 'device123',
      payload,
      type: 'controller'
    });

    expect(context.commit).toHaveBeenCalledWith(
      'UPDATE_CONFIG_VALUE',
      expect.objectContaining({
        timestamp: expect.stringMatching(/GMT/)
      })
    );
  });

  });


});
